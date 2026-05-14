"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiZap, FiUser, FiChefHat, FiArrowRight, FiLock, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-hot-toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<"provider" | "customer">("customer");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "provider" || r === "customer") setRole(r);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase().trim(), password, displayName: displayName.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Registration failed.");
        return;
      }
      toast.success("Account created successfully!");
      const signInResult = await signIn("credentials", { username: username.toLowerCase().trim(), password, redirect: false });
      if (signInResult?.error) { router.replace("/login"); return; }
      router.replace(role === "provider" ? "/provider/dashboard" : "/customer/home");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden" }}>
      {/* Background Decor */}
      <div style={{ position: "absolute", top: "20%", right: "10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 1 }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: "480px", position: "relative", zIndex: 2 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.25rem" }}>
            <div style={{ width: 44, height: 44, background: "var(--brand-primary)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}>
              <FiZap style={{ color: "#fff", fontSize: "1.4rem" }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1.8rem", color: "#fff", letterSpacing: "-0.04em" }}>TiffinPro</span>
          </Link>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
            {role === "provider" ? "Start your business" : "Join as a customer"}
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Create your account to get started</p>
        </div>

        <div className="card" style={{ padding: "2.5rem" }}>
          {/* Role Toggle */}
          <div style={{ marginBottom: "2rem" }}>
            <label className="field-label">Account Type</label>
            <div className="role-toggle" style={{ height: "50px" }}>
              <button type="button" className={`role-btn ${role === "provider" ? "active" : ""}`} onClick={() => setRole("provider")}>
                <FiChefHat style={{ marginRight: "0.5rem" }} /> Provider
              </button>
              <button type="button" className={`role-btn ${role === "customer" ? "active" : ""}`} onClick={() => setRole("customer")}>
                <FiUser style={{ marginRight: "0.5rem" }} /> Customer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="field-label">{role === "provider" ? "Business Name" : "Full Name"}</label>
              <input
                type="text"
                className="field-input"
                placeholder={role === "provider" ? "e.g. Fresh Tiffins" : "e.g. John Doe"}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="field-label">Username</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontWeight: 800 }}>@</span>
                <input
                  type="text"
                  className="field-input"
                  style={{ paddingLeft: "2.8rem" }}
                  placeholder="unique_handle"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="field-label">Password</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="field-label">Confirm</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.75rem", height: "52px", fontSize: "1.05rem" }}>
              {loading ? <span className="spinner" /> : "Create Account"}
            </button>
          </form>

          {role === "provider" && (
            <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--brand-success)", fontSize: "0.85rem", fontWeight: 700, justifyContent: "center" }}>
              <FiCheckCircle /> 7-day free trial included
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--brand-primary)", fontWeight: 700 }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
