import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import TiffinLog from "@/models/TiffinLog";
import ProviderCustomer from "@/models/ProviderCustomer";
import { z } from "zod";

const BulkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealName: z.string().min(1),
  customerIds: z.array(z.string()).min(1),
  status: z.enum(["delivered", "cancelled", "paused", "pending"]),
});

// POST /api/provider/deliveries/bulk
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
  }

  await connectDB();

  const { date, mealName, customerIds, status } = parsed.data;

  // 1. Fetch existing logs to calculate deltas
  const existingLogs = await TiffinLog.find({
    providerId: session.user.id,
    customerId: { $in: customerIds },
    date,
    mealName,
  }).lean();

  const oldLogMap = new Map();
  for (const log of existingLogs) {
    oldLogMap.set(String(log.customerId), log);
  }

  const customerDeltas = new Map<string, number>();

  for (const customerId of customerIds) {
    const oldLog = oldLogMap.get(customerId);
    const oldStatus = oldLog?.status || "pending";
    const quantity = oldLog?.quantity !== undefined ? oldLog.quantity : 1;
    let delta = 0;

    if (status === "delivered" && oldStatus !== "delivered") {
      delta = quantity;
    } else if (status !== "delivered" && oldStatus === "delivered") {
      delta = -quantity;
    }

    if (delta !== 0) {
      customerDeltas.set(customerId, delta);
    }
  }

  // 2. Update TiffinLogs
  if (status === "pending") {
    await TiffinLog.deleteMany({
      providerId: session.user.id,
      customerId: { $in: customerIds },
      date,
      mealName,
    });
  } else {
    const operations = customerIds.map((customerId) => ({
      updateOne: {
        filter: { providerId: session.user.id, customerId, date, mealName },
        update: { $set: { status } },
        upsert: true,
      },
    }));
    await TiffinLog.bulkWrite(operations);
  }

  // 3. Update ProviderCustomer mealsConsumed using bulkWrite
  if (customerDeltas.size > 0) {
    const pcOperations = Array.from(customerDeltas.entries()).map(([cId, delta]) => ({
      updateOne: {
        filter: { _id: cId, providerId: session.user.id },
        update: { $inc: { "mealPlan.mealsConsumed": delta } },
      },
    }));
    await ProviderCustomer.bulkWrite(pcOperations);
  }

  return NextResponse.json({ success: true, message: `Marked ${customerIds.length} tiffins as ${status}` });
}
