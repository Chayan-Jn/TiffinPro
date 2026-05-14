import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Invoice from "@/models/Invoice";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const EditSchema = z.object({
  totalAmount: z.number().min(0),
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

  const invoice = await Invoice.findOneAndUpdate(
    { _id: id, providerId: session.user.id, status: { $ne: "paid" } },
    { $set: { totalAmount: parsed.data.totalAmount } },
    { new: true, returnDocument: 'after' }
  ).lean();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found or already paid." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, invoice });
}
