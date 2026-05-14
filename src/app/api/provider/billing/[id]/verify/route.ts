import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Invoice from "@/models/Invoice";
import ProviderCustomer from "@/models/ProviderCustomer";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  await connectDB();

  const invoice = await Invoice.findOne({ _id: id, providerId: session.user.id });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice is already paid." }, { status: 400 });
  }

  // Mark invoice as paid
  invoice.status = "paid";
  await invoice.save();

  // Reset Customer Quota
  const customer = await ProviderCustomer.findOne({ _id: invoice.customerId, providerId: session.user.id });
  if (customer && customer.mealPlan && customer.mealPlan.planType === "monthly") {
    // Carry over extra consumed meals to the next cycle
    const extraMeals = Math.max(0, customer.mealPlan.mealsConsumed - customer.mealPlan.mealQuota);
    customer.mealPlan.mealsConsumed = extraMeals;

    // Shift start and end dates forward by 1 month to keep the cycle going
    if (customer.mealPlan.startDate) {
      const d = new Date(customer.mealPlan.startDate);
      d.setMonth(d.getMonth() + 1);
      customer.mealPlan.startDate = d;
    }
    if (customer.mealPlan.endDate) {
      const d = new Date(customer.mealPlan.endDate);
      d.setMonth(d.getMonth() + 1);
      customer.mealPlan.endDate = d;
    }

    // Recalculate Quota for the new month duration
    if (customer.mealPlan.startDate && customer.mealPlan.endDate) {
      const start = new Date(customer.mealPlan.startDate);
      const end = new Date(customer.mealPlan.endDate);
      const diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      customer.mealPlan.mealQuota = diffDays * customer.mealPlan.meals.length;
    }

    await customer.save();
  }

  return NextResponse.json({ ok: true, invoice });
}
