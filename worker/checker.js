"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// worker/checker.ts
const mongoose_1 = __importDefault(require("mongoose"));
const perf_hooks_1 = require("perf_hooks");
const got_1 = __importDefault(require("got"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Monitor_1 = __importDefault(require("../models/Monitor"));
const CheckResult_1 = __importDefault(require("../models/CheckResult"));
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/uptime_monitor_service";
const scheduled = new Map();
const running = new Set();
async function connectDB() {
    if (mongoose_1.default.connection.readyState === 1)
        return;
    await mongoose_1.default.connect(MONGODB_URI);
    console.log("Connected to MongoDB for worker");
}
/** Save check result + update monitor metadata */
async function saveResult(monitorId, statusCode, up, responseTimeMs, error, headers) {
    await CheckResult_1.default.create({
        monitorId,
        statusCode,
        up,
        responseTimeMs,
        error,
        headers,
        timestamp: new Date(),
    });
    await Monitor_1.default.findByIdAndUpdate(monitorId, {
        lastCheckedAt: new Date(),
        lastStatusCode: statusCode,
        lastUp: up,
    }).lean();
}
/** Actually perform a single check for monitorId */
async function performCheck(monitorId) {
    // prevent reentry
    if (running.has(monitorId)) {
        console.log(`[${monitorId}] check already running — skipping`);
        return;
    }
    running.add(monitorId);
    try {
        const monitor = await Monitor_1.default.findById(monitorId).lean();
        if (!monitor || !monitor.active) {
            running.delete(monitorId);
            return;
        }
        const timeout = monitor.timeoutMs ?? 10000;
        const expected = monitor.expectedStatusCodes && monitor.expectedStatusCodes.length > 0
            ? new Set(monitor.expectedStatusCodes)
            : undefined;
        const start = perf_hooks_1.performance.now();
        try {
            // default HEAD
            const res = await (0, got_1.default)(monitor.url, {
                method: "HEAD",
                throwHttpErrors: false,
                timeout: { request: timeout },
                followRedirect: true,
                retry: { limit: 0 },
            });
            const duration = Math.round(perf_hooks_1.performance.now() - start);
            let status = res.statusCode;
            let up = typeof status === "number" && (expected ? expected.has(status) : (status >= 200 && status < 400));
            // If HEAD is not allowed, fallback to GET
            if (status === 405 || status === 501) {
                const start = perf_hooks_1.performance.now();
                const res2 = await (0, got_1.default)(monitor.url, {
                    method: "GET",
                    throwHttpErrors: false,
                    timeout: { request: timeout },
                    followRedirect: true,
                    retry: { limit: 0 },
                });
                const totalDuration = Math.round(perf_hooks_1.performance.now() - start);
                status = res2.statusCode;
                up = (expected ? expected.has(status) : (status >= 200 && status < 400));
                await saveResult(monitor._id, status, up, totalDuration, null, res2.headers);
                console.log(`[${monitor.url}] GET fallback status=${status} up=${up} time=${totalDuration}ms`);
            }
            else {
                await saveResult(monitor._id, status, up, duration, null, res.headers);
                console.log(`[${monitor.url}] HEAD status=${status} up=${up} time=${duration}ms`);
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : "request error";
            const duration = Math.round(perf_hooks_1.performance.now() - start);
            await saveResult(monitor._id, undefined, false, duration, message, {});
            console.log(`[${monitor.url}] ERROR ${message} time=${duration}ms`);
        }
    }
    finally {
        running.delete(monitorId);
    }
}
/** Schedule a monitor's repeating checks with jitter */
function scheduleMonitor(monitor) {
    const id = monitor._id.toString();
    if (scheduled.has(id))
        return; // already scheduled
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
    scheduled.set(id, timeout);
    console.log(`Scheduled monitor ${monitor.url} every ${freqMs}ms (jitter ${jitter}ms)`);
}
/** Unschedule a monitor */
function unscheduleMonitor(monitorId) {
    const t = scheduled.get(monitorId);
    if (t) {
        clearInterval(t);
        scheduled.delete(monitorId);
        console.log(`Unscheduled monitor ${monitorId}`);
    }
}
/** Synchronize monitors from DB: add new schedules; remove deleted/inactive */
async function syncMonitors() {
    const monitors = await Monitor_1.default.find({ active: true });
    const remoteIds = new Set(monitors.map((m) => m._id.toString()));
    // schedule new ones
    for (const m of monitors) {
        if (!scheduled.has(m._id.toString()))
            scheduleMonitor(m);
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
