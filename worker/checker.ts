// worker/checker.ts
import mongoose from "mongoose";
import { performance } from "perf_hooks";
import got from "got";
import dotenv from "dotenv";
dotenv.config();

import Monitor, { IMonitor } from "../models/Monitor";
import CheckResult from "../models/CheckResult";


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/uptime_monitor_service";

const scheduled = new Map<string, NodeJS.Timeout>();
const running = new Set<string>();

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB for worker");
}

/** Save check result + update monitor metadata */
async function saveResult(
  monitorId: mongoose.Types.ObjectId,
  statusCode: number | undefined,
  up: boolean,
  responseTimeMs: number | undefined,
  error: string | null,
  headers: Record<string, string|string[]> | undefined
) {
  await CheckResult.create({
    monitorId,
    statusCode,
    up,
    responseTimeMs,
    error,
    headers,
    timestamp: new Date(),
  });

  await Monitor.findByIdAndUpdate(monitorId, {
    lastCheckedAt: new Date(),
    lastStatusCode: statusCode,
    lastUp: up,
  }).lean();
}

/** Actually perform a single check for monitorId */
async function performCheck(monitorId: string) {
  // prevent reentry
  if (running.has(monitorId)) {
    console.log(`[${monitorId}] check already running — skipping`);
    return;
  }
  running.add(monitorId);
  try {
    const monitor = await Monitor.findById<IMonitor>(monitorId).lean();
    if (!monitor || !monitor.active) {
      running.delete(monitorId);
      return;
    }

    const timeout = monitor.timeoutMs ?? 10000;
    const expected = monitor.expectedStatusCodes && monitor.expectedStatusCodes.length > 0
      ? new Set(monitor.expectedStatusCodes)
      : undefined;

    const start = performance.now();
    try {
      // default HEAD
      const res = await got(monitor.url, {
        method: "HEAD",
        throwHttpErrors: false,
        timeout: { request: timeout },
        followRedirect: true,
        retry: {limit: 0},
      });

      const duration = Math.round(performance.now() - start);
      let status = res.statusCode;
      let up = typeof status === "number" && (expected ? expected.has(status) : (status >= 200 && status < 400));

      // If HEAD is not allowed, fallback to GET
      if (status === 405 || status === 501) {
        const start = performance.now();
        const res2 = await got(monitor.url, {
          method: "GET",
          throwHttpErrors: false,
          timeout: { request: timeout },
          followRedirect: true,
          retry: {limit: 0},
        });
        const totalDuration = Math.round(performance.now() - start);
        status = res2.statusCode;
        up = (expected ? expected.has(status) : (status >= 200 && status < 400));
        await saveResult(monitor._id as mongoose.Types.ObjectId, status, up, totalDuration, null, res2.headers as Record<string, string | string[]>);
        console.log(`[${monitor.url}] GET fallback status=${status} up=${up} time=${totalDuration}ms`);
      } else {
        await saveResult(monitor._id as mongoose.Types.ObjectId, status, up, duration, null, res.headers as Record<string, string | string[]>);
        console.log(`[${monitor.url}] HEAD status=${status} up=${up} time=${duration}ms`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "request error";
      const duration = Math.round(performance.now() - start);

      await saveResult(
        monitor._id as mongoose.Types.ObjectId,
        undefined,
        false,
        duration,
        message,
        {}
      );
      console.log(`[${monitor.url}] ERROR ${message} time=${duration}ms`);
    }
  } finally {
    running.delete(monitorId);
  }
}

/** Schedule a monitor's repeating checks with jitter */
function scheduleMonitor(monitor: IMonitor) {
  const id = monitor._id.toString();
  if (scheduled.has(id)) return; // already scheduled

  const freqMs = Math.max(1000 * (monitor.frequencySec || 60), 10000); // enforce a safe minimum here if you prefer
  const jitter = Math.floor(Math.random() * Math.min(1000, freqMs));
  // first run after jitter
  const timeout = setTimeout(() => {
    performCheck(id);
    // subsequent runs
    const iv = setInterval(() => performCheck(id), freqMs);
    scheduled.set(id, iv);
  }, jitter);

  // for now store the initial timeout in the same map (clear both ways)
  scheduled.set(id, timeout as unknown as NodeJS.Timeout);
  console.log(`Scheduled monitor ${monitor.url} every ${freqMs}ms (jitter ${jitter}ms)`);
}

/** Unschedule a monitor */
function unscheduleMonitor(monitorId: string) {
  const t = scheduled.get(monitorId);
  if (t) {
    clearInterval(t);
    scheduled.delete(monitorId);
    console.log(`Unscheduled monitor ${monitorId}`);
  }
}

/** Synchronize monitors from DB: add new schedules; remove deleted/inactive */
async function syncMonitors() {
  const monitors:IMonitor[]= await Monitor.find({ active: true });
  const remoteIds = new Set(monitors.map((m) => m._id.toString()));

  // schedule new ones
  for (const m of monitors) {
    if (!scheduled.has(m._id.toString())) scheduleMonitor(m);
  }

  // unschedule ones that should no longer be running
  for (const scheduledId of Array.from(scheduled.keys())) {
    if (!remoteIds.has(scheduledId)) {
      unscheduleMonitor(scheduledId);
    }
  }
}

async function main() {
  await connectDB();
  await syncMonitors();
  // poll DB for new/removed monitors every 30 seconds
  setInterval(syncMonitors, 30 * 1000);
  console.log("Worker started");
}

main().catch((err) => {
  console.error("Worker error:", err);
  process.exit(1);
});
