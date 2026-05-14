import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import TiffinLog from "@/models/TiffinLog";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Fetch last 100 logs
  const logs = await TiffinLog.find({ providerId: session.user.id })
    .populate("customerId", "displayName phone")
    .sort({ date: -1, createdAt: -1 })
    .limit(100)
    .lean();

  return NextResponse.json({ logs });
}
