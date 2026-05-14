import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import DailyMenu from "@/models/DailyMenu";
import { z } from "zod";

// GET /api/provider/menu/daily?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }

  await connectDB();
  const menu = await DailyMenu.findOne({ providerId: session.user.id, date }).lean();

  return NextResponse.json({ menu: menu || { date, items: [] } });
}

const MenuItemSchema = z.object({
  mealName: z.string().min(1).trim(),
  description: z.string().trim(),
});

const PostSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(MenuItemSchema),
});

// POST /api/provider/menu/daily
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
  }

  await connectDB();
  
  // Filter out items with empty descriptions so we don't save blank fields
  const cleanItems = parsed.data.items.filter(item => item.description.length > 0);

  const menu = await DailyMenu.findOneAndUpdate(
    { providerId: session.user.id, date: parsed.data.date },
    { $set: { items: cleanItems } },
    { new: true, upsert: true } // Create if doesn't exist
  ).lean();

  return NextResponse.json({ success: true, menu });
}
