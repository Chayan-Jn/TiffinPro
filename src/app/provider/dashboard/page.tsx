import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProviderDashboard() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "provider") redirect("/customer/home");

  const user = session.user as { name?: string; username: string; role: string };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(249,115,22,0.1) 0%, transparent 60%), var(--surface-0)",
      }}
    >
      {/* Top Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-1)",
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
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Dashboard Body */}
      <main style={{ padding: "3rem 2rem", maxWidth: 1100, margin: "0 auto" }}>
        {/* Welcome */}
        <div style={{ marginBottom: "3rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.4rem",
            }}
          >
            Welcome back, {user.name ?? user.username} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Here&apos;s what&apos;s happening with your tiffin business today.
          </p>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            marginBottom: "3rem",
          }}
        >
          {[
            { label: "Total Customers", value: "—", icon: "👥" },
            { label: "Linked Accounts", value: "—", icon: "🔗" },
            { label: "Unlinked Records", value: "—", icon: "📋" },
            { label: "Active Tiffins", value: "—", icon: "🍱" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "1.5rem",
              }}
            >
              <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
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
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "1.25rem",
            }}
          >
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {[
              { label: "➕ Add Customer", desc: "Add a customer record" },
              { label: "🔍 Find by Username", desc: "Link a registered customer" },
              { label: "📦 Manage Tiffins", desc: "Coming soon" },
            ].map((action) => (
              <button
                key={action.label}
                disabled={action.desc === "Coming soon"}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.75rem 1.25rem",
                  color: action.desc === "Coming soon" ? "var(--text-muted)" : "var(--text-primary)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: action.desc === "Coming soon" ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                {action.label}
                <span
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontWeight: 400,
                    marginTop: "2px",
                  }}
                >
                  {action.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
