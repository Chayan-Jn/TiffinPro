"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiArrowRight, FiZap, FiLock, FiUser } from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: username.toLowerCase().trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Incorrect username or password.");
        return;
      }
      toast.success("Successfully signed in!");
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;
      if (role === "provider") router.replace("/provider/dashboard");
      else if (role === "customer") router.replace("/customer/home");
      else router.replace("/");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      {/* Background Decor */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 1 }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 2 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
            <div style={{ width: 44, height: 44, background: "var(--brand-primary)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}>
              <FiZap style={{ color: "#fff", fontSize: "1.4rem" }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1.8rem", color: "#fff", letterSpacing: "-0.04em" }}>TiffinPro</span>
          </Link>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Welcome back</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Sign in to continue to your dashboard</p>
        </div>

        <div className="card" style={{ padding: "2.5rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label className="field-label">Username</label>
              <div style={{ position: "relative" }}>
                <FiUser style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  className="field-input"
                  style={{ paddingLeft: "3.2rem" }}
                  placeholder="your_username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
                <Link href="#" style={{ fontSize: "0.8rem", color: "var(--brand-primary)", fontWeight: 700 }}>Forgot?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <FiLock style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type={showPw ? "text" : "password"}
                  className="field-input"
                  style={{ paddingLeft: "3.2rem", paddingRight: "3.5rem" }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem", height: "52px", fontSize: "1.05rem" }}>
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>New to TiffinPro?</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          <Link href="/register" style={{ 
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", 
            width: "100%", padding: "0.9rem", borderRadius: "var(--radius-md)", 
            background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", 
            color: "#fff", fontWeight: 700, fontSize: "0.95rem", transition: "all 0.2s" 
          }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
            Create an account <FiArrowRight />
          </Link>
        </div>

        <p style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
          &copy; {new Date().getFullYear()} TiffinPro. Built for professionals.
        </p>
      </div>
    </div>
  );
}
