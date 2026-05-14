import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import crypto from "crypto";
import SaaSPayment from "@/models/SaaSPayment";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Razorpay secret missing" }, { status: 500 });
  }

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const expectedSignature = shasum.digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  // Find the payment record
  const payment = await SaaSPayment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ success: true, message: "Already verified" });
  }

  // Update payment record
  payment.status = "paid";
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  await payment.save();

  // Extend provider's subscription
  const user = await User.findById(session.user.id);
  if (user) {
    const daysToAdd = payment.plan === "monthly" ? 30 : 365;
    
    let currentExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : new Date();
    
    // If they were already expired, start the new clock from today
    if (currentExpiry < new Date()) {
      currentExpiry = new Date();
    }
    
    currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
    user.subscriptionExpiry = currentExpiry;
    
    await user.save();
  }

  return NextResponse.json({ success: true });
}
