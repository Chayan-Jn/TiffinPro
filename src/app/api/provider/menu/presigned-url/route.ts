import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType } = await request.json();
  if (!filename || !contentType) {
    return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
  }

  try {
    const s3 = new S3Client({
      region: "us-east-005", // From endpoint
      endpoint: `https://${process.env.B2_ENDPOINT}`,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID!,
        secretAccessKey: process.env.B2_APPLICATION_KEY!,
      },
    });

    const extension = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const key = `menu_${session.user.id}_${Date.now()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET_NAME}/${key}`;

    return NextResponse.json({ uploadUrl: url, publicUrl, key });
  } catch (error: any) {
    console.error("Presigned URL Error:", error);
    return NextResponse.json({ error: "Could not generate upload URL." }, { status: 500 });
  }
}
