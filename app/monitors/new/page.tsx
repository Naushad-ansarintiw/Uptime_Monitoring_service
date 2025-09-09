"use client";

import { useState } from "react";

export default function NewMonitorPage() {
  const [urls, setUrls] = useState("");
  const [frequency, setFrequency] = useState(60);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/monitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls: urls.split(",").map((u) => u.trim()),
        frequencySec: frequency,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("✅ Monitor(s) added successfully!");
      setUrls("");
      setFrequency(60);
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
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
