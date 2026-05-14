import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FiArrowRight, FiCheckCircle, FiShield, FiZap, FiUsers, FiClock, FiActivity } from "react-icons/fi";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role === "provider") redirect("/provider/dashboard");
  if (session?.user?.role === "customer") redirect("/customer/home");

  return (
    <main style={{ minHeight: "100dvh", background: "#09090b", color: "#fff", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      {/* Dynamic Background Elements */}
      <div style={{ position: "fixed", top: -200, right: -100, width: "600px", height: "600px", background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -200, left: -100, width: "600px", height: "600px", background: "radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 }} />
      
      {/* Grid Pattern */}
      <div style={{ 
        position: "fixed", inset: 0, 
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", 
        backgroundSize: "60px 60px", pointerEvents: "none", zIndex: 1 
      }} />

      {/* Navbar */}
      <nav style={{ 
        display: "flex", alignItems: "center", justifyContent: "space-between", 
        padding: "0 5%", height: "80px", position: "sticky", top: 0, zIndex: 100, 
        backdropFilter: "blur(12px)", background: "rgba(9, 9, 11, 0.7)", borderBottom: "1px solid rgba(255,255,255,0.05)" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{ width: 40, height: 40, background: "var(--brand-primary)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}>
            <FiZap style={{ color: "#fff", fontSize: "1.4rem" }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "-0.04em" }}>TiffinPro</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/login" className="hover-white" style={{ fontWeight: 600, color: "var(--text-secondary)", transition: "color 0.2s" }}>Sign In</Link>
          <Link href="/register" className="btn-primary" style={{ width: "auto", padding: "0.7rem 1.6rem", borderRadius: 12 }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ position: "relative", zIndex: 2, paddingTop: "8rem", paddingBottom: "6rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingLeft: "5%", paddingRight: "5%" }}>
        <div className="animate-fade-up" style={{ 
          background: "rgba(99, 102, 241, 0.1)", color: "var(--brand-primary)", 
          padding: "0.5rem 1.25rem", borderRadius: "99px", fontSize: "0.85rem", 
          fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", 
          marginBottom: "2.5rem", border: "1px solid rgba(99, 102, 241, 0.2)",
          display: "inline-flex", alignItems: "center", gap: "0.5rem"
        }}>
          <FiActivity /> The Next Gen Tiffin Management Platform
        </div>

        <h1 className="animate-fade-up" style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.06em", marginBottom: "2.5rem", maxWidth: "1100px" }}>
          Elevate your tiffin <br />
          <span style={{ background: "linear-gradient(90deg, #818cf8, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>business today.</span>
        </h1>

        <p className="animate-fade-up" style={{ fontSize: "1.4rem", color: "var(--text-secondary)", maxWidth: "700px", lineHeight: 1.6, marginBottom: "4rem" }}>
          Stop wasting time on registers. Automate your customer tracking, billing, and meal management with TiffinPro&apos;s all-in-one OS.
        </p>

        <div className="animate-fade-up" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register?role=provider" className="btn-primary" style={{ width: "auto", padding: "1rem 2.5rem", fontSize: "1.1rem", borderRadius: 16 }}>
            Start Free Trial <FiArrowRight style={{ marginLeft: "0.5rem" }} />
          </Link>
          <Link href="/register?role=customer" className="hover-bg-light" style={{ 
            width: "auto", padding: "1rem 2.5rem", fontSize: "1.1rem", borderRadius: 16, 
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", 
            color: "#fff", fontWeight: 700, backdropFilter: "blur(10px)", transition: "all 0.3s" 
          }}>
            Find a Provider
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section style={{ position: "relative", zIndex: 2, padding: "4rem 5% 10rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        {[
          { 
            title: "Automated Billing", 
            desc: "Generate monthly or per-meal invoices instantly and track payments without manual effort.",
            icon: <FiZap />,
            color: "#818cf8"
          },
          { 
            title: "Live Tracking", 
            desc: "Customers get real-time visibility into their meal logs, increasing trust and reducing disputes.",
            icon: <FiActivity />,
            color: "#6366f1"
          },
          { 
            title: "Simple Management", 
            desc: "Update your daily menu and delivery status in seconds from your phone or desktop.",
            icon: <FiUsers />,
            color: "#4f46e5"
          }
        ].map((f, i) => (
          <div key={i} className="card animate-fade-up hover-lift-up" style={{ padding: "3rem 2rem", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${f.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", color: f.color, marginBottom: "2rem", border: `1px solid ${f.color}40` }}>
              {f.icon}
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem", color: "#fff" }}>{f.title}</h3>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "1rem" }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Trust Banner */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "4rem 5%", textAlign: "center", position: "relative", zIndex: 2, background: "rgba(0,0,0,0.3)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "2rem" }}>Trusted by 500+ Local Providers</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "3rem", opacity: 0.4, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, fontSize: "1.5rem" }}>INDIAN Tiffin</div>
          <div style={{ fontWeight: 900, fontSize: "1.5rem" }}>HomeDabba</div>
          <div style={{ fontWeight: 900, fontSize: "1.5rem" }}>MomsKitchen</div>
          <div style={{ fontWeight: 900, fontSize: "1.5rem" }}>DesiFood</div>
        </div>
        <div style={{ marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          &copy; {new Date().getFullYear()} TiffinPro Inc. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
