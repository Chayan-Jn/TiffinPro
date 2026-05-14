import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export default async function CustomerHome() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "customer") redirect("/provider/dashboard");

  const user = session.user as { name?: string; username: string; role: string };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(251,191,36,0.08) 0%, transparent 60%), var(--surface-0)",
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
              color: "var(--brand-amber)",
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.25)",
              borderRadius: 6,
              padding: "2px 8px",
              textTransform: "uppercase",
            }}
          >
            Customer
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
              }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </nav>

      {/* Home Body */}
      <main style={{ padding: "3rem 2rem", maxWidth: 900, margin: "0 auto" }}>
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
            Hello, {user.name ?? user.username} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem" }}>
            Manage your tiffin subscriptions and meal preferences.
          </p>
        </div>

        {/* My Providers */}
        <div
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "1rem",
            }}
          >
            My Providers
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "2rem",
              color: "var(--text-muted)",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🍽️</span>
            <p style={{ fontSize: "0.9rem" }}>
              You&apos;re not linked to any provider yet.
            </p>
            <p style={{ fontSize: "0.8rem" }}>
              A tiffin provider will link your account, or ask them to add you.
            </p>
          </div>
        </div>

        {/* My Meals */}
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
              marginBottom: "1rem",
            }}
          >
            Today&apos;s Meals
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "2rem",
              color: "var(--text-muted)",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>📭</span>
            <p style={{ fontSize: "0.9rem" }}>No meal plan available yet.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
