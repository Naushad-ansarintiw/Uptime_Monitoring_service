import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Monitor from "@/models/Monitor";
// 👉 CREATE new monitors
export async function POST(req) {
    try {
        await connectDB();
        const body = await req.json();
        const { urls, frequencySec, checkType } = body;
        if (!urls || !frequencySec || !checkType) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        // Derive default HTTP method based on checkType
        const method = checkType === "full_page" ? "GET" : "HEAD";
        const monitors = await Monitor.insertMany(urls.map((url) => ({
            url,
            frequencySec,
            checkType,
            method,
            active: true, // 👈 ensure it's active by default
        })));
        return NextResponse.json({ success: true, monitors });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
export async function GET() {
    try {
        await connectDB();
        const monitors = await Monitor.find().lean();
        return NextResponse.json(monitors, { status: 200 });
    }
    catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
