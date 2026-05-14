import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import Invoice from "@/models/Invoice";

// ── GET: Fetch customers who are overdue for a bill ──────────────────────────
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Find all active customers for this provider
  const customers = await ProviderCustomer.find({
    providerId: session.user.id,
    tiffinStatus: "active",
    "mealPlan.mealQuota": { $gt: 0 },
  }).lean();

  // Filter for overdue customers (consumed >= quota)
  const overdueCustomers = customers.filter(c => 
    c.mealPlan && c.mealPlan.mealsConsumed >= c.mealPlan.mealQuota
  );

  // Check if any of these already have a pending/uploaded invoice
  // We shouldn't prompt the provider to generate a bill if one already exists
  const existingInvoices = await Invoice.find({
    providerId: session.user.id,
    customerId: { $in: overdueCustomers.map(c => c._id) },
    status: { $in: ["pending", "uploaded"] }
  }).lean();

  const customersWithActiveInvoices = new Set(existingInvoices.map(inv => String(inv.customerId)));

  // Final list of customers who need a bill generated NOW
  const dueCustomers = overdueCustomers.filter(c => !customersWithActiveInvoices.has(String(c._id)));

  return NextResponse.json({ dueCustomers });
}

// ── POST: Generate bills for selected customers ──────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerIds } = await request.json();
  if (!Array.isArray(customerIds) || customerIds.length === 0) {
    return NextResponse.json({ error: "No customers selected." }, { status: 400 });
  }

  await connectDB();

  const customers = await ProviderCustomer.find({
    _id: { $in: customerIds },
    providerId: session.user.id,
  }).lean();

  const invoicesToInsert = [];

  for (const customer of customers) {
    if (!customer.mealPlan) continue;

    const { planType, rate, startDate, endDate } = customer.mealPlan;
    
    // Format period string safely
    const startStr = startDate ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Start';
    const endStr = endDate ? new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'End';
    
    invoicesToInsert.push({
      providerId: session.user.id,
      customerId: customer._id,
      billingType: planType,
      periodString: `${startStr} - ${endStr}`,
      totalAmount: rate, // Flat rate for monthly
      status: "pending",
    });
  }

  if (invoicesToInsert.length > 0) {
    await Invoice.insertMany(invoicesToInsert);
  }

  return NextResponse.json({ ok: true, count: invoicesToInsert.length });
}
