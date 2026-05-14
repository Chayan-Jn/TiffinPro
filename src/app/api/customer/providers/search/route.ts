import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import ProviderCustomer from "@/models/ProviderCustomer";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.toLowerCase().trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  await connectDB();

  // Search providers by username OR display name (business name)
  const providers = await User.find({
    role: "provider",
    $or: [
      { username: { $regex: q, $options: "i" } },
      { displayName: { $regex: q, $options: "i" } },
    ],
  })
    .select("username displayName")
    .limit(8)
    .lean();

  // Exclude providers already subscribed to
  const subscribed = await ProviderCustomer.find({
    userId: session.user.id,
    providerId: { $in: providers.map((p) => p._id) },
  })
    .select("providerId")
    .lean();

  const subscribedIds = new Set(subscribed.map((s) => String(s.providerId)));

  const results = providers
    .filter((p) => !subscribedIds.has(String(p._id)))
    .map((p) => ({ username: p.username, displayName: p.displayName }));

  return NextResponse.json({ results });
}
