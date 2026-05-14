import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import TiffinLog from "@/models/TiffinLog";
import ProviderCustomer from "@/models/ProviderCustomer";
import { z } from "zod";

// ── GET: Fetch today's adjustments for the customer ───────────────────────
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });

  await connectDB();

  // First, find the ProviderCustomer records for this user
  const providerCustomers = await ProviderCustomer.find({ userId: session.user.id }).lean();
  const customerIds = providerCustomers.map(pc => pc._id);

  const logs = await TiffinLog.find({
    customerId: { $in: customerIds },
    date: date
  }).lean();

  return NextResponse.json({ logs });
}

// ── POST: Save/update a daily adjustment ──────────────────────────────────
const AdjustSchema = z.object({
  providerId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealName: z.string().min(1),
  quantity: z.number().min(0),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { providerId, date, mealName, quantity } = parsed.data;

  await connectDB();

  // Validate that the customer is actually linked to this provider
  const customerRecord = await ProviderCustomer.findOne({
    providerId: providerId,
    userId: session.user.id
  });

  if (!customerRecord) {
    return NextResponse.json({ error: "You are not subscribed to this provider." }, { status: 403 });
  }

  // Find existing log
  let log = await TiffinLog.findOne({
    customerId: customerRecord._id,
    date: date,
    mealName: mealName
  });

  if (log) {
    // If provider already delivered or cancelled it, customer cannot modify it
    if (log.status === "delivered" || log.status === "cancelled") {
      return NextResponse.json({ error: "This meal has already been processed by the provider." }, { status: 403 });
    }
    
    // If setting back to 1 (standard), and it was just pending, we could technically just delete the log 
    // or keep it as pending with quantity 1. Keeping it is fine.
    log.quantity = quantity;
    await log.save();
  } else {
    // Create new log
    log = await TiffinLog.create({
      providerId: providerId,
      customerId: customerRecord._id,
      date: date,
      mealName: mealName,
      quantity: quantity,
      status: "pending"
    });
  }

  return NextResponse.json({ ok: true, log });
}
