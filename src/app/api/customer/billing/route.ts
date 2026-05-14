import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import Invoice from "@/models/Invoice";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Find all ProviderCustomer records linked to this user
  const linkedRecords = await ProviderCustomer.find({
    userId: session.user.id,
  }).select("_id providerId").lean();

  const customerIds = linkedRecords.map(r => r._id);

  // Fetch all invoices for these customer records
  const invoices = await Invoice.find({
    customerId: { $in: customerIds },
  })
    .populate("providerId", "displayName paymentUpiId paymentQrUrl")
    .sort({ createdAt: -1 })
    .lean();

  // Sign all the QR code keys so the frontend can load them
  for (const inv of invoices) {
    if (inv.providerId && (inv.providerId as any).paymentQrUrl) {
      let key = (inv.providerId as any).paymentQrUrl;
      if (key.startsWith('http')) {
        try {
          const url = new URL(key);
          const bucketPrefix = `/${process.env.B2_BUCKET_NAME}/`;
          if (url.pathname.includes(bucketPrefix)) {
            key = url.pathname.split(bucketPrefix)[1];
          } else {
            key = url.pathname.substring(1);
          }
        } catch {}
      }
      (inv.providerId as any).paymentQrUrl = await getPresignedGetUrl(key);
    }
  }

  return NextResponse.json({ invoices });
}
