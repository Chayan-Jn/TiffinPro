import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getPresignedGetUrl } from "@/lib/s3";
import { z } from "zod";

const Schema = z.object({
  menuImageUrl: z.string(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, { menuImageUrl: parsed.data.menuImageUrl });

  let signedUrl = "";
  if (parsed.data.menuImageUrl) {
    let key = parsed.data.menuImageUrl;
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        key = url.pathname.split('/').pop() || key;
      } catch {}
    }
    signedUrl = await getPresignedGetUrl(key);
  }

  return NextResponse.json({ success: true, menuImageUrl: signedUrl });
}
