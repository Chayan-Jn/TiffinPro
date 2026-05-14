"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiArrowRight, FiLock, FiUser } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";
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
    <div className="auth-wrap">
      {/* Background Decor */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)", filter: "blur(60px)", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 1 }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.5rem" }}>
            <div style={{ width: 44, height: 44, background: "var(--brand)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px var(--brand-glow)" }}>
              <LuUtensils style={{ color: "#fff", fontSize: "1.4rem" }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1.8rem", color: "#fff", letterSpacing: "-0.04em" }}>TiffinPro</span>
          </Link>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Welcome back</h1>
          <p style={{ color: "var(--t2)", marginTop: "0.5rem", fontWeight: 500 }}>Sign in to your dashboard</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            <div>
              <label className="field-label">Username</label>
              <div style={{ position: "relative" }}>
                <FiUser style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--t3)", zIndex: 5 }} />
                <input
                  type="text"
                  className="field-input"
                  style={{ paddingLeft: "3.2rem" }}
                  placeholder="your_handle"
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
                <Link href="#" style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 800 }}>Forgot?</Link>
              </div>
              <div style={{ position: "relative" }}>
                <FiLock style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--t3)", zIndex: 5 }} />
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
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--t3)", cursor: "pointer", display: "flex", alignItems: "center" }}
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem", height: "54px" }}>
              {loading ? <span className="spinner" /> : "Sign In"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--bd)" }} />
            <span style={{ fontSize: "0.7rem", color: "var(--t4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>New to TiffinPro?</span>
            <div style={{ flex: 1, height: "1px", background: "var(--bd)" }} />
          </div>

          <Link href="/register" className="btn-ghost" style={{ width: "100%", height: "52px" }}>
            Create an account <FiArrowRight />
          </Link>
        </div>

        <p style={{ textAlign: "center", marginTop: "2.5rem", color: "var(--t3)", fontSize: "0.85rem", fontWeight: 600 }}>
          &copy; {new Date().getFullYear()} TiffinPro. Built for professionals.
        </p>
      </div>
    </div>
  );
}
