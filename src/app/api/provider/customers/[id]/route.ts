import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH /api/provider/customers/[id] — Edit record ────────────────────────
const EditSchema = z.object({
  displayName: z.string().min(1).max(80).transform((v) => v.trim()).optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional().or(z.literal("")),
  tiffinStatus: z.enum(["active", "on_hold"]).optional(),
  notes: z.string().max(500).optional(),
  mealPlan: z.object({
    planType: z.enum(["monthly", "per_tiffin", "custom"]),
    rate: z.number().min(0),
    startDate: z.string(),
    endDate: z.string().optional(),
    meals: z.array(z.string()).min(1),
    mealQuota: z.number().optional(),
    mealsConsumed: z.number().optional(),
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

  const updateData: any = {};
  if (parsed.data.displayName !== undefined) updateData.displayName = parsed.data.displayName;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.tiffinStatus !== undefined) updateData.tiffinStatus = parsed.data.tiffinStatus;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  if (parsed.data.mealPlan) {
    const p = parsed.data.mealPlan;
    updateData["mealPlan.planType"] = p.planType;
    updateData["mealPlan.rate"] = p.rate;
    updateData["mealPlan.startDate"] = p.startDate;
    if (p.endDate) updateData["mealPlan.endDate"] = p.endDate;
    updateData["mealPlan.meals"] = p.meals;

    if (p.mealQuota !== undefined) {
      updateData["mealPlan.mealQuota"] = p.mealQuota;
    } else if (p.planType === "monthly" && p.endDate) {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      const diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      updateData["mealPlan.mealQuota"] = diffDays * p.meals.length;
    } else {
      updateData["mealPlan.mealQuota"] = 0;
    }

    if (p.mealsConsumed !== undefined) {
      updateData["mealPlan.mealsConsumed"] = p.mealsConsumed;
    }
  }

  const record = await ProviderCustomer.findOneAndUpdate(
    { _id: id, providerId: session.user.id },
    { $set: updateData },
    { new: true, returnDocument: 'after' }
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
