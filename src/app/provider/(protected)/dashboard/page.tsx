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
    { label: "Active Tiffins", value: stats.total, sub: `B:${stats.mealCounts.Breakfast} L:${stats.mealCounts.Lunch} D:${stats.mealCounts.Dinner}`, color: "var(--brand)", border: "rgba(255,107,53,0.15)", icon: <LuUtensils /> },
    { label: "Customers",     value: stats.active,   sub: "Running service",  color: "var(--green)", border: "rgba(34,197,94,0.15)", icon: <LuCircleCheck /> },
    { label: "Paused",        value: stats.onHold,   sub: "Tiffins on hold",  color: "var(--amber)", border: "rgba(245,158,11,0.15)", icon: <LuCirclePause /> },
    { label: "Linked Users",  value: stats.connected, sub: "Synced app users",  color: "var(--brand)", border: "rgba(255,107,53,0.15)", icon: <LuLink2 /> },
  ];

  return (
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <p style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>{today}</p>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.04em" }}>
            Overview
          </h1>
        </div>
        <Link href="/provider/customers" className="btn-primary" style={{ padding: "0.8rem 1.75rem" }}>
          <LuPlus /> Add Customer
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          {cards.map(c => (
            <div key={c.label} className="card hover-lift-up" style={{ borderColor: c.border, background: "var(--s1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ width: 44, height: 44, background: "var(--s2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: c.color, border: `1px solid ${c.border}` }}>
                  {c.icon}
                </div>
              </div>
              <div style={{ fontSize: "2.5rem", fontWeight: 950, color: "#fff", lineHeight: 1, letterSpacing: "-0.06em", marginBottom: "0.5rem" }}>
                {c.value}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--t2)", marginBottom: "0.15rem" }}>{c.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--t3)", fontWeight: 600 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Grid */}
        <div className="card" style={{ background: "var(--s1)", padding: "2.5rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "2rem" }}>
            Quick Management
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            <Link href="/provider/customers"    className="btn-ghost" style={{ padding: "1.25rem", justifyContent: "flex-start", fontSize: "1rem" }}><LuUsers /> Manage Customers</Link>
            <Link href="/provider/deliveries"   className="btn-ghost" style={{ padding: "1.25rem", justifyContent: "flex-start", fontSize: "1rem" }}><LuTruck /> Daily Deliveries</Link>
            <Link href="/provider/menu"         className="btn-ghost" style={{ padding: "1.25rem", justifyContent: "flex-start", fontSize: "1rem" }}><LuClipboardList /> Meal Menu</Link>
            <Link href="/provider/history"      className="btn-ghost" style={{ padding: "1.25rem", justifyContent: "flex-start", fontSize: "1rem" }}><LuBookOpen /> Business Ledger</Link>
            <Link href="/provider/billing"      className="btn-ghost" style={{ padding: "1.25rem", justifyContent: "flex-start", fontSize: "1rem" }}><LuCreditCard /> Billing & Invoices</Link>
            <Link href="/provider/subscription" className="btn-ghost" style={{ padding: "1.25rem", justifyContent: "flex-start", fontSize: "1rem", color: "var(--brand)" }}><LuStar /> Premium Subscription</Link>
          </div>
        </div>

        {stats.total === 0 && (
          <div style={{ padding: "1.5rem", background: "rgba(255,107,53,0.05)", border: "1px solid rgba(255,107,53,0.1)", borderRadius: "var(--r2)", display: "flex", alignItems: "center", gap: "1rem" }}>
            <LuLightbulb style={{ fontSize: "1.5rem", color: "var(--amber)" }} />
            <p style={{ color: "var(--t2)", fontSize: "0.95rem", fontWeight: 500 }}>
              No tiffins logged for today yet. 
              <Link href="/provider/deliveries" style={{ color: "var(--brand)", fontWeight: 800, marginLeft: "0.5rem" }}>Update deliveries →</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
