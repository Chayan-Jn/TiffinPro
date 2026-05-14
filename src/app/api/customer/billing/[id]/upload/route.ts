import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Invoice from "@/models/Invoice";
import ProviderCustomer from "@/models/ProviderCustomer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { filename, contentType } = await request.json();

  if (!filename || !contentType) {
    return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
  }

  await connectDB();

  // Verify the invoice belongs to a ProviderCustomer record owned by this user
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const linkedRecord = await ProviderCustomer.findOne({
    _id: invoice.customerId,
    userId: session.user.id,
  });

  if (!linkedRecord) {
    return NextResponse.json({ error: "Unauthorized for this invoice." }, { status: 403 });
  }

  try {
    const s3 = new S3Client({
      region: "us-east-005",
      endpoint: `https://${process.env.B2_ENDPOINT}`,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
      },
    });

    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `payments/inv_${invoice._id}_${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // Update invoice status to uploaded and save the key
    invoice.status = "uploaded";
    invoice.paymentProofUrl = key;
    await invoice.save();

    return NextResponse.json({ uploadUrl: url, key });
  } catch (error: any) {
    console.error("Presigned URL Error:", error);
    return NextResponse.json({ error: "Could not generate upload URL." }, { status: 500 });
  }
}
