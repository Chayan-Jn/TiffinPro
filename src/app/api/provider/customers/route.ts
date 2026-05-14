import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import User from "@/models/User";
import { z } from "zod";

// ── GET /api/provider/customers ─────────────────────────────────────────────
export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const records = await ProviderCustomer.find({ providerId: session.user.id })
    .populate("userId", "username displayName")
    .populate("possibleDuplicateOf", "displayName")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ records });
}

// ── POST /api/provider/customers ────────────────────────────────────────────
const AddSchema = z.union([
  z.object({
    mode: z.literal("manual"),
    displayName: z.string().min(1).max(80).transform((v) => v.trim()),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
  }),
  z.object({
    mode: z.literal("username"),
    username: z.string().min(1).transform((v) => v.toLowerCase().trim()),
  }),
]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AddSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();

  // ── Mode A: Manual add ───────────────────────────────────────────────────
  if (parsed.data.mode === "manual") {
    const { displayName, phone } = parsed.data;

    // Check if a connected customer with a similar name exists — warn provider
    const allLinked = await ProviderCustomer.find({
      providerId: session.user.id,
      status: "linked",
    }).select("displayName _id").lean();

    let possibleDuplicateOf = null;
    const nameLower = displayName.toLowerCase();
    for (const lr of allLinked) {
      const lrLower = lr.displayName.toLowerCase();
      if (lrLower.includes(nameLower) || nameLower.includes(lrLower)) {
        possibleDuplicateOf = lr._id;
        break;
      }
    }

    const record = await ProviderCustomer.create({
      providerId: session.user.id,
      displayName,
      phone,
      status: "unlinked",
      possibleDuplicateOf,
    });

    return NextResponse.json({
      record: record.toJSON(),
      warning:
        possibleDuplicateOf
          ? "A connected customer has a similar name — possible duplicate."
          : null,
    }, { status: 201 });
  }

  // ── Mode B: Add by username ──────────────────────────────────────────────
  const { username } = parsed.data;
  const targetUser = await User.findOne({ username, role: "customer" }).lean();
  if (!targetUser) {
    return NextResponse.json({ error: "No customer found with that username." }, { status: 404 });
  }

  // Already linked?
  const existing = await ProviderCustomer.findOne({
    providerId: session.user.id,
    userId: targetUser._id,
  });
  if (existing) {
    return NextResponse.json({ error: "This customer is already in your list." }, { status: 409 });
  }

  const record = await ProviderCustomer.create({
    providerId: session.user.id,
    userId: targetUser._id,
    displayName: targetUser.displayName,
    status: "linked",
  });

  // Flag any existing manual records with similar names as possible duplicates
  const nameLower = targetUser.displayName.toLowerCase();
  const unlinked = await ProviderCustomer.find({
    providerId: session.user.id,
    status: "unlinked",
    possibleDuplicateOf: null,
  });

  for (const u of unlinked) {
    const uNameLower = u.displayName.toLowerCase();
    if (uNameLower.includes(nameLower) || nameLower.includes(uNameLower)) {
      await ProviderCustomer.updateOne(
        { _id: u._id },
        { $set: { possibleDuplicateOf: record._id } }
      );
    }
  }

  return NextResponse.json({ record: record.toJSON() }, { status: 201 });
}
