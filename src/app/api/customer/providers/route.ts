import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import User from "@/models/User";
import { z } from "zod";

// ── GET /api/customer/providers ─────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const records = await ProviderCustomer.find({
    userId: session.user.id,
    status: "linked",
  })
    .select("-notes") // return everything except provider's private notes
    .populate("providerId", "username displayName")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ records });
}

// ── POST /api/customer/providers ────────────────────────────────────────────
const SubscribeSchema = z.object({
  username: z.string().min(1).transform((v) => v.toLowerCase().trim()),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();

  const provider = await User.findOne({
    username: parsed.data.username,
    role: "provider",
  }).lean();
  if (!provider) {
    return NextResponse.json({ error: "No provider found with that username." }, { status: 404 });
  }

  // Already linked?
  const existing = await ProviderCustomer.findOne({
    providerId: provider._id,
    userId: session.user.id,
  });
  if (existing) {
    return NextResponse.json(
      { error: "You are already subscribed to this provider." },
      { status: 409 }
    );
  }

  // Create the linked record
  const record = await ProviderCustomer.create({
    providerId: provider._id,
    userId: session.user.id,
    displayName: (session.user as { name?: string }).name ?? session.user.username,
    status: "linked",
    tiffinStatus: "active",
  });

  // Smart merge: find unlinked manual records with similar name on provider side
  const customerName = record.displayName.toLowerCase();
  const manualRecords = await ProviderCustomer.find({
    providerId: provider._id,
    status: "unlinked",
    possibleDuplicateOf: null,
  })
    .select("_id displayName")
    .lean();

  const duplicates = manualRecords.filter((r) => {
    const rLower = r.displayName.toLowerCase();
    return rLower.includes(customerName) || customerName.includes(rLower);
  });

  // Flag those manual records as possible duplicates
  if (duplicates.length > 0) {
    await ProviderCustomer.updateMany(
      { _id: { $in: duplicates.map((d) => d._id) } },
      { $set: { possibleDuplicateOf: record._id } }
    );
  }

  return NextResponse.json({
    record,
    warning:
      duplicates.length > 0
        ? "The provider may already have a manual record matching your name. They can review and delete the duplicate from their dashboard."
        : null,
    potentialDuplicates: duplicates.map((d) => d.displayName),
  }, { status: 201 });
}
