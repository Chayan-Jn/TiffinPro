"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  FiArrowRight, FiUser, FiMail, FiLock, 
  FiUsers, FiCheck
} from "react-icons/fi";
import { LuUtensils, LuChefHat } from "react-icons/lu";
import { toast } from "react-hot-toast";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "customer" ? "customer" : "provider";

  const [role, setRole] = useState<"provider" | "customer">(initialRole);
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "customer") setRole("customer");
    else if (r === "provider") setRole("provider");
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username.toLowerCase().trim(),
          password: formData.password,
          displayName: formData.displayName,
          role: role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      {/* Background Decor */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "900px", height: "900px", background: "radial-gradient(circle, rgba(255, 107, 53, 0.08) 0%, transparent 70%)", filter: "blur(70px)", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 1 }} />

      <div className="animate-fade-up" style={{ width: "100%", maxWidth: "480px", position: "relative", zIndex: 10, padding: "2rem 0" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.8rem", marginBottom: "1.25rem" }}>
            <div style={{ width: 44, height: 44, background: "var(--brand)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px var(--brand-glow)" }}>
              <LuUtensils style={{ color: "#fff", fontSize: "1.4rem" }} />
            </div>
            <span style={{ fontWeight: 900, fontSize: "1.8rem", color: "#fff", letterSpacing: "-0.04em" }}>TiffinPro</span>
          </Link>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            Join as a <span style={{ color: "var(--brand)" }}>{role}</span>
          </h1>
          <p style={{ color: "var(--t2)", marginTop: "0.5rem", fontWeight: 600 }}>Create your account to get started</p>
        </div>

        <div className="auth-card" style={{ maxWidth: "100%" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Role Switcher */}
            <div>
              <label className="field-label">Account Type</label>
              <div className="role-toggle">
                <button 
                  type="button" 
                  className={`role-btn ${role === "provider" ? "active" : ""}`}
                  onClick={() => setRole("provider")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <LuChefHat /> Provider
                  </div>
                </button>
                <button 
                  type="button" 
                  className={`role-btn ${role === "customer" ? "active" : ""}`}
                  onClick={() => setRole("customer")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                    <FiUsers /> Customer
                  </div>
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
              <div>
                <label className="field-label">Full Name</label>
                <div style={{ position: "relative" }}>
                  <FiUser style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--t3)", zIndex: 5 }} />
                  <input
                    type="text"
                    className="field-input"
                    style={{ paddingLeft: "3.2rem" }}
                    placeholder="e.g. John Doe"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Username</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--t3)", fontWeight: 700, zIndex: 5 }}>@</span>
                  <input
                    type="text"
                    className="field-input"
                    style={{ paddingLeft: "2.8rem" }}
                    placeholder="unique_handle"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="field-label">Password</label>
                  <div style={{ position: "relative" }}>
                    <FiLock style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--t3)", zIndex: 5, fontSize: "0.9rem" }} />
                    <input
                      type="password"
                      className="field-input"
                      style={{ paddingLeft: "2.8rem", fontSize: "0.85rem" }}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Confirm</label>
                  <div style={{ position: "relative" }}>
                    <FiCheck style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--t3)", zIndex: 5, fontSize: "0.9rem" }} />
                    <input
                      type="password"
                      className="field-input"
                      style={{ paddingLeft: "2.8rem", fontSize: "0.85rem" }}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ height: "54px", marginTop: "0.5rem" }}>
              {loading ? <span className="spinner" /> : "Create Account"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "2rem", borderTop: "1px solid var(--bd)", paddingTop: "1.5rem" }}>
            <p style={{ color: "var(--t3)", fontSize: "0.9rem", fontWeight: 500 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--brand)", fontWeight: 800 }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}><span className="spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
