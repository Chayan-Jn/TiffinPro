import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import SaaSPayment from "@/models/SaaSPayment";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(session.user.id).lean();
  const history = await SaaSPayment.find({ providerId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    subscriptionExpiry: user?.subscriptionExpiry || null,
    history,
  });
}
