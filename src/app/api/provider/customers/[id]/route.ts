import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH /api/provider/customers/[id] — Edit record ────────────────────────
const EditSchema = z.object({
  displayName: z.string().min(1).max(80).transform((v) => v.trim()).optional(),
  phone: z.string().max(15).optional(),
  tiffinStatus: z.enum(["active", "on_hold"]).optional(),
  notes: z.string().max(500).optional(),
  mealPlan: z.object({
    planType: z.enum(["monthly", "per_tiffin", "custom"]),
    rate: z.number().min(0),
    startDate: z.string(),
    endDate: z.string().optional(),
    meals: z.array(z.string()).min(1),
  }).optional(),
});

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();

  const record = await ProviderCustomer.findOneAndUpdate(
    { _id: id, providerId: session.user.id },
    { $set: parsed.data },
    { new: true }
  ).lean();

  if (!record) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json({ record });
}

// ── DELETE /api/provider/customers/[id] — Remove record ─────────────────────
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await connectDB();

  const record = await ProviderCustomer.findOneAndDelete({
    _id: id,
    providerId: session.user.id,
  });

  if (!record) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  // Clear any possibleDuplicateOf references pointing to deleted record
  await ProviderCustomer.updateMany(
    { possibleDuplicateOf: record._id },
    { $set: { possibleDuplicateOf: null } }
  );

  return NextResponse.json({ ok: true });
}
