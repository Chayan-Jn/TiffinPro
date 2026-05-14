import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import User from "@/models/User";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const LinkSchema = z.object({
  username: z.string().min(1).transform((v) => v.toLowerCase().trim()),
});

// PATCH /api/provider/customers/[id]/link
// Links an existing manual record to a registered customer account
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = LinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();

  // Verify the record belongs to this provider and is unlinked
  const record = await ProviderCustomer.findOne({
    _id: id,
    providerId: session.user.id,
    status: "unlinked",
  });
  if (!record) {
    return NextResponse.json({ error: "Record not found or already linked." }, { status: 404 });
  }

  // Find the target customer account
  const targetUser = await User.findOne({
    username: parsed.data.username,
    role: "customer",
  }).lean();
  if (!targetUser) {
    return NextResponse.json({ error: "No customer found with that username." }, { status: 404 });
  }

  // Ensure this user isn't already linked to another record for this provider
  const alreadyLinked = await ProviderCustomer.findOne({
    providerId: session.user.id,
    userId: targetUser._id,
  });
  if (alreadyLinked) {
    return NextResponse.json(
      { error: "This customer is already linked to another record in your list." },
      { status: 409 }
    );
  }

  // Link the record
  record.userId = targetUser._id as typeof record.userId;
  record.status = "linked";
  record.possibleDuplicateOf = null;
  await record.save();

  return NextResponse.json({ record });
}
