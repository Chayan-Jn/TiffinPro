import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/customer/providers/[id]
// Unsubscribes from a provider — DOWNGRADES to manual, does not delete
// Provider retains their notes/phone on the record
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await connectDB();

  // Find the record — must belong to this customer
  const record = await ProviderCustomer.findOne({
    _id: id,
    userId: session.user.id,
  });

  if (!record) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  // Downgrade to manual (unlinked) — keep provider's data intact
  record.userId = null;
  record.status = "unlinked";
  record.possibleDuplicateOf = null;
  await record.save();

  return NextResponse.json({
    ok: true,
    message: "Unsubscribed. The provider retains your record as a manual entry.",
  });
}
