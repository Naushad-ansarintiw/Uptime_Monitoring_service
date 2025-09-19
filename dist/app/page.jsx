"use client";
import { useEffect, useState } from "react";
import MonitorCard from "./components/MonitorCard";
import AddMonitor from "./monitors/new/page";
export default function Dashboard() {
    const [monitors, setMonitors] = useState([]);
    useEffect(() => {
        async function fetchMonitors() {
            const res = await fetch("/api/monitors");
            const data = await res.json();
            setMonitors(data);
        }
        fetchMonitors();
    }, []);
    return (<div className="flex flex-col">
      <AddMonitor />
      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 ">
      {monitors.map((m) => (<MonitorCard key={m._id} monitorId={m._id} url={m.url}/>))}
    </main>
    </div>);
}
