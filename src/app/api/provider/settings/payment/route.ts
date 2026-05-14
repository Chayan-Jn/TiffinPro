import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getPresignedGetUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(session.user.id).select("paymentUpiId paymentQrUrl").lean();

  let signedUrl = "";
  if (user?.paymentQrUrl) {
    let key = user.paymentQrUrl;
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
    signedUrl = await getPresignedGetUrl(key);
  }

  return NextResponse.json({
    paymentUpiId: user?.paymentUpiId || "",
    paymentQrUrl: signedUrl,
    paymentQrKey: user?.paymentQrUrl || "",
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { paymentUpiId, paymentQrUrl } = await request.json();

  await connectDB();
  
  const updateData: any = {};
  if (paymentUpiId !== undefined) updateData.paymentUpiId = paymentUpiId;
  if (paymentQrUrl !== undefined) updateData.paymentQrUrl = paymentQrUrl;

  await User.findByIdAndUpdate(session.user.id, { $set: updateData });

  let signedUrl = "";
  if (paymentQrUrl) {
    let key = paymentQrUrl;
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
    signedUrl = await getPresignedGetUrl(key);
  }

  return NextResponse.json({ ok: true, paymentQrUrl: signedUrl });
}
