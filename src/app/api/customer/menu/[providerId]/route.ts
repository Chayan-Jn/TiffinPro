import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import DailyMenu from "@/models/DailyMenu";
import { getPresignedGetUrl } from "@/lib/s3";

type RouteContext = { params: Promise<{ providerId: string }> };

// GET /api/customer/menu/[providerId]?date=YYYY-MM-DD
export async function GET(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { providerId } = await ctx.params;
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }

  await connectDB();

  // Get provider to find menuImageUrl
  const provider = await User.findOne({ _id: providerId, role: "provider" })
    .select("menuImageUrl displayName")
    .lean();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  // Get the daily text menu
  const menu = await DailyMenu.findOne({ providerId, date }).lean();

  let signedUrl = "";
  if (provider.menuImageUrl) {
    // If it's an old full URL format, extract the key. Otherwise, just use the key.
    let key = provider.menuImageUrl;
    if (key.includes('/')) key = key.split('/').pop() || key;
    signedUrl = await getPresignedGetUrl(key);
  }

  return NextResponse.json({
    providerName: provider.displayName,
    menuImageUrl: signedUrl,
    dailyMenu: menu ? menu.items : [],
  });
}
