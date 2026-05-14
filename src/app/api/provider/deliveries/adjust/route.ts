import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import TiffinLog from "@/models/TiffinLog";
import ProviderCustomer from "@/models/ProviderCustomer";
import { z } from "zod";

const AdjustSchema = z.object({
  customerId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealName: z.string().min(1),
  quantity: z.number().min(0),
});

// POST /api/provider/deliveries/adjust
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { customerId, date, mealName, quantity } = parsed.data;

  await connectDB();

  let log = await TiffinLog.findOne({
    providerId: session.user.id,
    customerId,
    date,
    mealName,
  });

  if (log) {
    // If it's already delivered, we need to adjust mealsConsumed
    if (log.status === "delivered" && log.quantity !== quantity) {
      const delta = quantity - log.quantity;
      await ProviderCustomer.updateOne(
        { _id: customerId, providerId: session.user.id },
        { $inc: { "mealPlan.mealsConsumed": delta } }
      );
    }
    
    log.quantity = quantity;
    if (quantity === 0 && log.status === "pending") {
      log.status = "cancelled"; // auto-cancel if 0 requested by provider
    }
    await log.save();
  } else {
    // Create new
    log = await TiffinLog.create({
      providerId: session.user.id,
      customerId,
      date,
      mealName,
      quantity,
      status: quantity === 0 ? "cancelled" : "pending"
    });
  }

  return NextResponse.json({ success: true, log });
}
