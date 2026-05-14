import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Link from "next/link";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import { FiLogOut, FiActivity, FiAlertTriangle } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

export default async function ProtectedProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "provider") redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user) redirect("/login");

  // Handle subscription expiry
  if (!user.subscriptionExpiry) {
    user.subscriptionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();
  }
  const isExpired = user.subscriptionExpiry && new Date() > user.subscriptionExpiry;

  return (
    <div className="app-shell">
      <MobileNav />
      
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div style={{ width: 34, height: 34, background: "var(--brand)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px var(--brand-glow)" }}>
            <LuUtensils style={{ color: "#fff", fontSize: "1.1rem" }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.04em" }}>TiffinPro</span>
          <span style={{ marginLeft: "auto", fontSize: "0.6rem", fontWeight: 800, color: "var(--brand)", background: "rgba(255, 107, 53, 0.1)", border: "1px solid rgba(255, 107, 53, 0.2)", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" }}>Pro</span>
        </div>

        <SidebarNav />

        <div className="sidebar-bottom">
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{user.displayName ?? user.username}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>@{user.username}</div>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button type="submit" className="nav-item" style={{ width: "100%", background: "var(--s2)", border: "1px solid var(--bd)", cursor: "pointer", color: "var(--t3)" }}>
              <FiLogOut /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div style={{ filter: isExpired ? "blur(12px)" : "none", pointerEvents: isExpired ? "none" : "auto", transition: "filter 0.4s ease" }}>
          {children}
        </div>

        {isExpired && (
          <div style={{ 
            position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", 
            background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(6px)", padding: "2rem"
          }}>
            <div className="card animate-fade-up" style={{ textAlign: "center", maxWidth: 440, padding: "3.5rem", boxShadow: "0 32px 64px rgba(0,0,0,0.5)" }}>
               <div style={{ width: 80, height: 80, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
                 <FiAlertTriangle style={{ fontSize: "2.5rem", color: "var(--red)" }} />
               </div>
               <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#fff", marginBottom: "1rem", letterSpacing: "-0.04em" }}>Subscription Expired</h2>
               <p style={{ color: "var(--t2)", marginBottom: "2.5rem", lineHeight: 1.6, fontSize: "1rem" }}>
                 Your access is temporarily limited. Please renew your subscription to resume managing your tiffins.
               </p>
               <Link href="/provider/subscription" className="btn-primary" style={{ textDecoration: "none" }}>
                 Renew Subscription <FiActivity />
               </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
