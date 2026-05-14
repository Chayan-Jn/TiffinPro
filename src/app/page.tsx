import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FiArrowRight } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.role === "provider") redirect("/provider/dashboard");
  if (session?.user?.role === "customer") redirect("/customer/home");

  return (
    <main style={{ minHeight: "100dvh", background: "var(--bg)", color: "var(--t1)", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      {/* Background Decor */}
      <div style={{ position: "fixed", top: -150, right: -150, width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255, 107, 53, 0.1) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, left: -150, width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255, 107, 53, 0.05) 0%, transparent 70%)", filter: "blur(100px)", pointerEvents: "none" }} />
      
      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }} />

      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6%", height: "90px", position: "relative", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{ width: 42, height: 42, background: "var(--brand)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px var(--brand-glow)" }}>
            <LuUtensils style={{ color: "#fff", fontSize: "1.4rem" }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.6rem", letterSpacing: "-0.04em" }}>TiffinPro</span>
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <Link href="/login" className="hover-white" style={{ fontWeight: 700, color: "var(--t2)", fontSize: "0.95rem" }}>Sign In</Link>
          <Link href="/register" className="btn-primary" style={{ padding: "0.75rem 1.75rem", borderRadius: "14px" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 6%", position: "relative", zIndex: 10 }}>
        <div className="animate-fade-up" style={{ 
          background: "rgba(255, 107, 53, 0.08)", color: "var(--brand)", 
          padding: "0.6rem 1.25rem", borderRadius: "99px", fontSize: "0.8rem", 
          fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", 
          marginBottom: "2.5rem", border: "1px solid rgba(255, 107, 53, 0.15)"
        }}>
          Automated Tiffin Management
        </div>

        <h1 className="animate-fade-up" style={{ fontSize: "clamp(3.5rem, 12vw, 7rem)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.06em", marginBottom: "2.5rem", maxWidth: "1000px" }}>
          Your Kitchen, <br />
          <span style={{ color: "var(--brand)" }}>Fully Automated.</span>
        </h1>

        <p className="animate-fade-up" style={{ fontSize: "1.35rem", color: "var(--t2)", maxWidth: "600px", lineHeight: 1.6, marginBottom: "4rem", fontWeight: 500 }}>
          Manage customers, deliveries, and billing with the world&apos;s most powerful OS built specifically for tiffin providers.
        </p>

        <div className="animate-fade-up" style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register?role=provider" className="btn-primary" style={{ padding: "1.1rem 3rem", fontSize: "1.1rem", borderRadius: "18px" }}>
            I am a Provider <FiArrowRight style={{ marginLeft: "0.6rem" }} />
          </Link>
          <Link href="/register?role=customer" className="btn-ghost" style={{ padding: "1.1rem 3rem", fontSize: "1.1rem", borderRadius: "18px", background: "rgba(255,255,255,0.02)" }}>
            I am a Customer
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer style={{ padding: "4rem 6%", textAlign: "center", color: "var(--t3)", fontSize: "0.85rem", fontWeight: 600 }}>
        <p>&copy; {new Date().getFullYear()} TiffinPro. Built for professionals.</p>
      </footer>
    </main>
  );
}
