import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { z } from "zod";

const Schema = z.object({
  menuImageUrl: z.string().url(),
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

  return NextResponse.json({ success: true, menuImageUrl: parsed.data.menuImageUrl });
}
