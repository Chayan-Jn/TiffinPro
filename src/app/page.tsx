import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role === "provider") redirect("/provider/dashboard");
  if (session?.user?.role === "customer") redirect("/customer/home");

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,115,22,0.18) 0%, transparent 70%), var(--surface-0)",
      }}
    >
      <style>{`
        .hover-card {
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .hover-card-provider:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 16px 48px rgba(249,115,22,0.25) !important;
        }
        .hover-card-customer:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
      `}</style>
      {/* Logo / Brand */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "20px",
            background: "linear-gradient(135deg, var(--brand-orange), var(--brand-amber))",
            marginBottom: "1.25rem",
            fontSize: "2rem",
            boxShadow: "0 8px 32px rgba(249,115,22,0.4)",
          }}
        >
          🍱
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #fff 30%, var(--brand-amber))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0.75rem",
          }}
        >
          TiffinPro
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1.1rem",
            maxWidth: 420,
            lineHeight: 1.6,
          }}
        >
          The smart way to manage your tiffin business — from meal planning to
          customer delivery.
        </p>
      </div>

      {/* CTA Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
          width: "100%",
          maxWidth: 580,
        }}
      >
        <Link
          href="/register?role=provider"
          style={{ textDecoration: "none" }}
        >
          <div
            className="landing-card hover-card hover-card-provider"
            style={{
              background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))",
              border: "1px solid rgba(249,115,22,0.3)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👨‍🍳</div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--brand-amber)",
                marginBottom: "0.4rem",
              }}
            >
              I&apos;m a Provider
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Manage customers, track tiffin deliveries, and grow your business.
            </p>
          </div>
        </Link>

        <Link
          href="/register?role=customer"
          style={{ textDecoration: "none" }}
        >
          <div
            className="hover-card hover-card-customer"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🙋</div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: "0.4rem",
              }}
            >
              I&apos;m a Customer
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              Subscribe to tiffin providers and manage your meal preferences.
            </p>
          </div>
        </Link>
      </div>

      {/* Already have account */}
      <p style={{ marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          style={{
            color: "var(--brand-orange)",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Sign in →
        </Link>
      </p>
    </main>
  );
}
