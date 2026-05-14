import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Invoice from "@/models/Invoice";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const invoices = await Invoice.find({ providerId: session.user.id })
    .populate("customerId", "displayName userId")
    .sort({ createdAt: -1 })
    .lean();

  for (const inv of invoices) {
    if (inv.paymentProofUrl) {
      let key = inv.paymentProofUrl;
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
      inv.paymentProofUrl = await getPresignedGetUrl(key);
    }
  }

  return NextResponse.json({ invoices });
}
