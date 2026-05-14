import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import ProviderCustomer from "@/models/ProviderCustomer";

async function getStats(providerId: string) {
  await connectDB();
  const [tiffinsToday, onHold, manual, connected] = await Promise.all([
    ProviderCustomer.countDocuments({ providerId, tiffinStatus: "active" }),
    ProviderCustomer.countDocuments({ providerId, tiffinStatus: "on_hold" }),
    ProviderCustomer.countDocuments({ providerId, status: "unlinked" }),
    ProviderCustomer.countDocuments({ providerId, status: "linked" }),
  ]);
  return { tiffinsToday, onHold, manual, connected };
}

export default async function ProviderDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "provider") redirect("/customer/home");

  const user = session.user as { name?: string; username: string; role: string; id: string };
  const stats = await getStats(user.id);

  const statCards = [
    {
      label: "Tiffins Today",
      value: stats.tiffinsToday,
      icon: "🍱",
      color: "var(--brand-orange)",
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.2)",
    },
    {
      label: "On Hold",
      value: stats.onHold,
      icon: "⏸️",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
    },
    {
      label: "Manual",
      value: stats.manual,
      icon: "📋",
      color: "var(--text-secondary)",
      bg: "var(--surface-2)",
      border: "var(--border)",
    },
    {
      label: "Connected",
      value: stats.connected,
      icon: "🔗",
      color: "#34d399",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.2)",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(249,115,22,0.1) 0%, transparent 60%), var(--surface-0)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🍱</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              background: "linear-gradient(135deg, #fff, var(--brand-amber))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TiffinPro
          </span>
          <span
            style={{
              marginLeft: "0.5rem",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "var(--brand-orange)",
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: 6,
              padding: "2px 8px",
              textTransform: "uppercase",
            }}
          >
            Provider
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href="/provider/customers"
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Customers
          </Link>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            @{user.username}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                borderRadius: 8,
                padding: "0.4rem 0.9rem",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      <main style={{ padding: "3rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        {/* Welcome */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.35rem",
            }}
          >
            Welcome back, {user.name ?? user.username} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Here&apos;s your tiffin business overview for today.
          </p>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2.5rem",
          }}
        >
          {statCards.map((stat) => (
            <div
              key={stat.label}
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
              }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: stat.color,
                  marginBottom: "0.2rem",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "1.25rem",
            }}
          >
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link
              href="/provider/customers"
              style={{
                background: "var(--brand-orange)",
                color: "#fff",
                padding: "0.7rem 1.25rem",
                borderRadius: "var(--radius-sm)",
                fontWeight: 700,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              👥 Manage Customers
            </Link>
            <Link
              href="/provider/deliveries"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0.7rem 1.25rem",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              🚚 Deliveries
            </Link>
            <Link
              href="/provider/menu"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                padding: "0.7rem 1.25rem",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              📋 Menu Management
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
