import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import TiffinLog from "@/models/TiffinLog";
import { z } from "zod";

const BulkSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealName: z.string().min(1),
  customerIds: z.array(z.string()).min(1),
  status: z.enum(["delivered", "cancelled", "paused", "pending"]),
});

// POST /api/provider/deliveries/bulk
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = BulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
  }

  await connectDB();

  const { date, mealName, customerIds, status } = parsed.data;

  if (status === "pending") {
    // "Undo" logic: If setting back to pending, we delete the override logs completely.
    await TiffinLog.deleteMany({
      providerId: session.user.id,
      customerId: { $in: customerIds },
      date,
      mealName,
    });
    return NextResponse.json({ success: true, message: `Reverted ${customerIds.length} tiffins to pending` });
  }

  // Use MongoDB bulkWrite for fast upserts
  const operations = customerIds.map((customerId) => ({
    updateOne: {
      filter: {
        providerId: session.user.id,
        customerId,
        date,
        mealName,
      },
      update: { $set: { status } },
      upsert: true,
    },
  }));

  await TiffinLog.bulkWrite(operations);

  return NextResponse.json({ success: true, message: `Marked ${customerIds.length} tiffins as ${status}` });
}
