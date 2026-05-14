import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";
import TiffinLog from "@/models/TiffinLog";
import { 
  LuUsers, LuTruck, LuClipboardList, 
  LuBookOpen, LuCreditCard, LuSettings, LuStar, 
  LuPlus, LuUtensilsCrossed, LuCircleCheck, 
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
    c.mealPlan?.meals?.forEach((m: string) => {
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
    { label: "Tiffins Today", value: stats.total, sub: `B:${stats.mealCounts.Breakfast} L:${stats.mealCounts.Lunch} D:${stats.mealCounts.Dinner}`, color: "var(--accent)", border: "rgba(255,69,0,0.2)", icon: <LuUtensilsCrossed /> },
    { label: "Active",        value: stats.active,   sub: "Running tiffins",  color: "#22c55e", border: "rgba(34,197,94,0.2)", icon: <LuCircleCheck /> },
    { label: "On Hold",       value: stats.onHold,   sub: "Paused tiffins",   color: "var(--amber)", border: "rgba(245,158,11,0.2)", icon: <LuCirclePause /> },
    { label: "Connected",     value: stats.connected, sub: "App-linked",      color: "#60a5fa", border: "rgba(96,165,250,0.2)", icon: <LuLink2 /> },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="top-bar">
        <div>
          <p style={{ fontSize: "0.68rem", color: "var(--t3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{today}</p>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--t1)", letterSpacing: "-0.02em" }}>
            Dashboard Overview
          </h1>
        </div>
        <Link href="/provider/customers" className="btn btn-accent" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", gap: "0.4rem" }}>
          <LuPlus /> Add Customer
        </Link>
      </div>

      <div style={{ padding: "1.75rem" }}>
        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {cards.map(c => (
            <div key={c.label} className="stat-card" style={{ borderColor: c.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "1.2rem", color: c.color }}>{c.icon}</div>
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: c.color, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: "0.25rem" }}>
                {c.value}
              </div>
              <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--t1)", marginBottom: "0.1rem" }}>{c.label}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--t3)", fontWeight: 500 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Grid */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--bd2)", borderRadius: "var(--r3)", padding: "1.75rem" }}>
          <p style={{ fontSize: "0.72rem", fontWeight: 800, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "1.25rem" }}>
            Quick Management
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            <Link href="/provider/customers"    className="qa-link accent" style={{ padding: "0.8rem" }}><LuUsers /> Manage Customers</Link>
            <Link href="/provider/deliveries"   className="qa-link" style={{ padding: "0.8rem" }}><LuTruck /> Daily Deliveries</Link>
            <Link href="/provider/history"      className="qa-link" style={{ padding: "0.8rem" }}><LuBookOpen /> Business Ledger</Link>
            <Link href="/provider/menu"         className="qa-link" style={{ padding: "0.8rem" }}><LuClipboardList /> Meal Menu</Link>
            <Link href="/provider/billing"      className="qa-link" style={{ padding: "0.8rem" }}><LuCreditCard /> Billing & Invoices</Link>
            <Link href="/provider/settings"     className="qa-link" style={{ padding: "0.8rem" }}><LuSettings /> Account Settings</Link>
            <Link href="/provider/subscription" className="qa-link gold" style={{ padding: "0.8rem" }}><LuStar /> Premium Features</Link>
          </div>
        </div>

        {stats.total === 0 && (
          <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "rgba(255,69,0,0.03)", border: "1px solid rgba(255,69,0,0.12)", borderRadius: "var(--r2)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <LuLightbulb style={{ fontSize: "1.25rem", color: "var(--amber)" }} />
            <p style={{ color: "var(--t2)", fontSize: "0.875rem", lineHeight: 1.5 }}>
              No tiffins logged for today yet. 
              <Link href="/provider/customers" style={{ color: "var(--accent)", fontWeight: 700, marginLeft: "0.4rem" }}>Mark deliveries →</Link>
            </p>
          </div>
        )}
      </div>
    </>
  );
}
