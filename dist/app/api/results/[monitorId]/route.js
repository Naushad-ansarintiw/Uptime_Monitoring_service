import { NextResponse } from "next/server";
import CheckResult from "@/models/CheckResult";
import { connectDB } from "@/lib/mongodb";
export async function GET(req, context) {
    await connectDB();
    const { monitorId } = await context.params;
    const results = await CheckResult.find({ monitorId })
        .sort({ timestamp: -1 })
        .limit(10)
        .lean();
    return NextResponse.json(results.reverse());
}
