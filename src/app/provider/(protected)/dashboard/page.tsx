import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import TiffinLog from "@/models/TiffinLog";
import { 
  LuUsers, LuTruck, LuClipboardList, 
  LuBookOpen, LuCreditCard, LuSettings, LuStar, 
  LuPlus, LuUtensils, LuCircleCheck, 
  LuCirclePause, LuLink2, LuLightbulb 
} from "react-icons/lu";

async function getStats(providerId: string) {
  await connectDB();
  const [activeCustomers, onHold, manual, connected] = await Promise.all([
    ProviderCustomer.find({ providerId, tiffinStatus: "active" }).lean(),
    ProviderCustomer.countDocuments({ providerId, tiffinStatus: "on_hold" }),
    ProviderCustomer.countDocuments({ providerId, status: "unlinked" }),
    ProviderCustomer.countDocuments({ providerId, status: "linked" }),
  ]);
  const mealCounts: Record<string, number> = { Breakfast: 0, Lunch: 0, Dinner: 0 };
  const activeIds = activeCustomers.map(c => String(c._id));
  activeCustomers.forEach(c => {
    (c.mealPlan as any)?.meals?.forEach((m: string) => {
      if (mealCounts[m] !== undefined) mealCounts[m] += 1;
    });
  });
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const todayLogs = await TiffinLog.find({ providerId, date: todayStr }).lean();
  todayLogs.forEach(log => {
    if (activeIds.includes(String(log.customerId)) && mealCounts[log.mealName] !== undefined) {
      const qty = log.status === "cancelled" ? 0 : (log.quantity ?? 1);
      mealCounts[log.mealName] += (qty - 1);
    }
  });
  return { 
    total: mealCounts.Breakfast + mealCounts.Lunch + mealCounts.Dinner, 
    mealCounts, 
    onHold, 
    manual, 
    connected, 
    active: activeCustomers.length 
  };
}

export default async function ProviderDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "provider") redirect("/customer/home");
  
  const user = session.user as { name?: string; username: string; role: string; id: string };
  const stats = await getStats(user.id);
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });

  const cards = [
    { label: "Active Tiffins", value: stats.total, sub: `B:${stats.mealCounts.Breakfast} L:${stats.mealCounts.Lunch} D:${stats.mealCounts.Dinner}`, color: "var(--brand)", border: "rgba(255,107,53,0.2)", icon: <LuUtensils />, glow: "var(--brand-glow)" },
    { label: "Total Active",   value: stats.active,   sub: "Subscribers",  color: "var(--green)", border: "rgba(34,197,94,0.2)", icon: <LuCircleCheck />, glow: "rgba(34,197,94,0.15)" },
    { label: "On Hold",        value: stats.onHold,   sub: "Paused service",  color: "var(--amber)", border: "rgba(245,158,11,0.2)", icon: <LuCirclePause />, glow: "rgba(245,158,11,0.15)" },
    { label: "App Linked",     value: stats.connected, sub: "Synced users",  color: "var(--brand)", border: "rgba(255,107,53,0.2)", icon: <LuLink2 />, glow: "var(--brand-glow)" },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--brand)", fontWeight: 950, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>{today}</p>
          <h1 style={{ fontSize: "3rem", fontWeight: 950, color: "#fff", letterSpacing: "-0.05em" }}>
            Overview
          </h1>
        </div>
        <Link href="/provider/customers" className="btn-primary" style={{ padding: "1rem 2rem", fontSize: "1rem" }}>
          <LuPlus /> Add New Customer
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
          {cards.map(c => (
            <div key={c.label} className="card hover-lift-up" style={{ borderColor: "var(--bd)", background: "var(--s1)", padding: "2.5rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: c.color, opacity: 0.8 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ width: 50, height: 50, background: "var(--s2)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, border: "1px solid var(--bd2)", boxShadow: `0 8px 20px ${c.glow}` }}>
                  {c.icon}
                </div>
              </div>
              <div style={{ fontSize: "3rem", fontWeight: 950, color: "#fff", lineHeight: 1, letterSpacing: "-0.06em", marginBottom: "0.75rem" }}>
                {c.value}
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--t1)", marginBottom: "0.25rem" }}>{c.label}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--t3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Grid */}
        <div className="card" style={{ background: "var(--s1)", padding: "3rem", border: "1px solid var(--bd)" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 950, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "2.5rem" }}>
            Business Management
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {[
              { href: "/provider/customers",    label: "Manage Customers", icon: <LuUsers />, desc: "Add or edit subscribers" },
              { href: "/provider/deliveries",   label: "Daily Deliveries", icon: <LuTruck />, desc: "Track fulfillment logs" },
              { href: "/provider/menu",         label: "Meal Menu", icon: <LuClipboardList />, desc: "Update daily specials" },
              { href: "/provider/history",      label: "Business Ledger", icon: <LuBookOpen />, desc: "Full audit trail" },
              { href: "/provider/billing",      label: "Billing & Invoices", icon: <LuCreditCard />, desc: "Manage payments" },
              { href: "/provider/subscription", label: "Premium Access", icon: <LuStar />, desc: "Plan and benefits", accent: true },
            ].map(link => (
              <Link 
                key={link.href}
                href={link.href} 
                className="btn-ghost hover-lift-up" 
                style={{ 
                  padding: "1.75rem", justifyContent: "flex-start", fontSize: "1.1rem", height: "auto", 
                  textAlign: "left", gap: "1.5rem", borderRadius: "var(--r3)", 
                  background: link.accent ? "rgba(255,107,53,0.05)" : "var(--s2)",
                  borderColor: link.accent ? "rgba(255,107,53,0.2)" : "var(--bd2)",
                  color: link.accent ? "var(--brand)" : "var(--t1)"
                }}
              >
                <div style={{ fontSize: "1.8rem" }}>{link.icon}</div>
                <div>
                  <div style={{ fontWeight: 900 }}>{link.label}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--t3)", fontWeight: 600, marginTop: "0.2rem" }}>{link.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {stats.total === 0 && (
          <div className="animate-fade-up" style={{ padding: "2rem", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: "var(--r3)", display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ width: 44, height: 44, background: "var(--brand)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 12px var(--brand-glow)" }}>
              <LuLightbulb style={{ fontSize: "1.4rem" }} />
            </div>
            <div>
              <p style={{ color: "#fff", fontSize: "1.1rem", fontWeight: 900 }}>No activity recorded for today.</p>
              <p style={{ color: "var(--t3)", fontSize: "0.9rem", fontWeight: 600, marginTop: "0.25rem" }}>
                Head over to the <Link href="/provider/deliveries" style={{ color: "var(--brand)", fontWeight: 900, textDecoration: "none" }}>Delivery Manager</Link> to start fulfilling tiffins.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
