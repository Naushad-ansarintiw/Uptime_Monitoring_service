"use client";

import { useState } from "react";

export default function NewMonitorPage() {
  const [urls, setUrls] = useState("");
  const [frequency, setFrequency] = useState(60);
  const [checkType, setCheckType] = useState<"http_ping" | "full_page">("http_ping");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: urls.split(",").map((u) => u.trim()),
        frequencySec: frequency,
        checkType, 
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Monitor(s) added successfully!");
      setUrls("");
      setFrequency(60);
      setCheckType("http_ping");
    } else {
      setMessage("❌ " + data.error);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add Monitor</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter URLs (comma separated)"
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="w-full border rounded p-2"
        />
        <input
          type="number"
          min={30}
          value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="w-full border rounded p-2"
        />

        {/* 👇 New dropdown for request type */}
        <select
          value={checkType}
          onChange={(e) => setCheckType(e.target.value as "http_ping" | "full_page")}
          className="w-full border rounded p-2"
        >
          <option value="http_ping">HEAD (fast check)</option>
          <option value="full_page">GET (full page load, TTFB & total time)</option>
        </select>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
