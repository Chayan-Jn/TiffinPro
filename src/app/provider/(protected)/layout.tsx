import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export default async function ProtectedProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "provider") {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    redirect("/login");
  }

  // Check subscription expiry
  if (user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
    redirect("/provider/subscription");
  }

  // If no expiry is set (legacy accounts), we should ideally give them a trial.
  // For now, if null, we let them pass or redirect.
  // Let's enforce that ALL providers must have an expiry. 
  if (!user.subscriptionExpiry) {
    // We could automatically give them a 7-day trial here, or redirect.
    // Let's redirect to subscription page which will handle it.
    redirect("/provider/subscription");
  }

  return <>{children}</>;
}
