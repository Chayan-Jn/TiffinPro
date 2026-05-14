import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import TiffinLog from "@/models/TiffinLog";

// GET /api/provider/deliveries?date=YYYY-MM-DD&meal=Lunch
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date");
  const meal = request.nextUrl.searchParams.get("meal");

  if (!date || !meal) {
    return NextResponse.json({ error: "Missing date or meal parameter" }, { status: 400 });
  }

  await connectDB();

  // Find active customers who are subscribed to this meal
  const customers = await ProviderCustomer.find({
    providerId: session.user.id,
    tiffinStatus: "active",
    "mealPlan.meals": meal,
  }).lean();

  if (customers.length === 0) {
    return NextResponse.json({ deliveries: [] });
  }

  // Find existing logs for this date and meal
  const logs = await TiffinLog.find({
    providerId: session.user.id,
    date,
    mealName: meal,
    customerId: { $in: customers.map((c) => c._id) },
  }).lean();

  // Create a map of existing log statuses
  const logMap = new Map();
  logs.forEach((log) => {
    logMap.set(String(log.customerId), { status: log.status, logId: log._id });
  });

  // Combine customers with their log status (or "pending" if no log exists)
  const deliveries = customers.map((c) => {
    const existing = logMap.get(String(c._id));
    return {
      customerId: c._id,
      displayName: c.displayName,
      phone: c.phone,
      status: existing?.status || "pending",
      logId: existing?.logId || null,
    };
  });

  return NextResponse.json({ deliveries });
}
