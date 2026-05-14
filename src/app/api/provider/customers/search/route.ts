import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import ProviderCustomer from "@/models/ProviderCustomer";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  await connectDB();

  // Find customer accounts whose username OR display name matches
  const users = await User.find({
    role: "customer",
    $or: [
      { username: { $regex: q, $options: "i" } },
      { displayName: { $regex: q, $options: "i" } },
    ],
  })
    .select("username displayName")
    .limit(8)
    .lean();

  // Exclude customers already linked to this provider
  const linked = await ProviderCustomer.find({
    providerId: session.user.id,
    userId: { $in: users.map((u) => u._id) },
  })
    .select("userId")
    .lean();

  const linkedIds = new Set(linked.map((l) => String(l.userId)));

  const results = users
    .filter((u) => !linkedIds.has(String(u._id)))
    .map((u) => ({ username: u.username, displayName: u.displayName }));

  return NextResponse.json({ results });
}
