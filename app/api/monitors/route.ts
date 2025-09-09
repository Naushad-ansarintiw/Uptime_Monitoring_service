import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Monitor from "@/models/Monitor";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { urls, frequencySec } = body;

    if (!urls || !frequencySec) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const monitors = await Monitor.insertMany(
      urls.map((url: string) => ({ url, frequencySec }))
    );

    return NextResponse.json({ success: true, monitors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}



