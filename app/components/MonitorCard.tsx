"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { main } from "@/worker/checker";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface CheckResult {
  _id: string;
  statusCode?: number;
  up: boolean;
  responseTimeMs?: number;
  ttfbMs?: number;
  totalTimeMs?: number;
  timestamp: string;
}

export default function MonitorCard({
  monitorId,
  url,
}: {
  monitorId: string;
  url: string;
}) {
  const [checks, setChecks] = useState<CheckResult[]>([]);

  useEffect(() => {
    async function fetchChecks() {
      const res = await fetch(`/api/results/${monitorId}`);
      const data = await res.json();
      setChecks(data);
    }
    fetchChecks();
    const interval = setInterval(fetchChecks, 30_000); 
    return () => clearInterval(interval);
  }, [monitorId]);

  const latest = checks[checks.length - 1];
  const status = latest?.up ? "Up ✅" : "Down ❌";

  const chartData = {
    labels: checks.map((c) => new Date(c.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Response Time (ms)",
        data: checks.map((c) => c.responseTimeMs ?? 0),
        borderColor: "rgb(59,130,246)", // blue-500
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.3,
      },
      {
        label: "TTFB (ms)",
        data: checks.map((c) => c.ttfbMs ?? 0),
        borderColor: "rgb(34,197,94)", // green-500
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="border rounded-lg p-4 shadow bg-white">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-lg">{url}</h2>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            latest?.up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </span>
      </div>

      {checks.length > 0 ? (
        <Line data={chartData} />
      ) : (
        <p className="text-gray-500">Waiting for results...</p>
      )}
    </div>
  );
}
