"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<"provider" | "customer">("customer");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-select role from landing page CTA query param
  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "provider" || r === "customer") setRole(r);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // 1. Register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          password,
          displayName: displayName.trim(),
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // 2. Auto sign-in
      const signInResult = await signIn("credentials", {
        username: username.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registered but couldn't auto-login — send to login page
        router.replace("/login");
        return;
      }

      // 3. Auto-redirect to role dashboard
      if (role === "provider") {
        router.replace("/provider/dashboard");
      } else {
        router.replace("/customer/home");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background:
          "radial-gradient(ellipse 60% 50% at 50% -5%, rgba(249,115,22,0.12) 0%, transparent 70%), var(--surface-0)",
      }}
    >
      {/* Brand mark */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.6rem" }}>🍱</span>
          <span
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #fff, var(--brand-amber))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TiffinPro
          </span>
        </div>
      </Link>

      <div className="auth-card">
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "0.4rem",
          }}
        >
          Create your account
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          Join TiffinPro and get started in seconds
        </p>

        {/* Role Toggle */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="field-label" style={{ marginBottom: "0.6rem" }}>
            I am a
          </label>
          <div className="role-toggle">
            <button
              id="role-provider"
              type="button"
              className={`role-btn ${role === "provider" ? "active" : ""}`}
              onClick={() => setRole("provider")}
            >
              👨‍🍳 Provider
            </button>
            <button
              id="role-customer"
              type="button"
              className={`role-btn ${role === "customer" ? "active" : ""}`}
              onClick={() => setRole("customer")}
            >
              🙋 Customer
            </button>
          </div>
        </div>

        {error && (
          <div className="error-alert" style={{ marginBottom: "1.25rem" }}>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <div>
            <label htmlFor="reg-displayname" className="field-label">
              {role === "provider" ? "Business / Your Name" : "Your Name"}
            </label>
            <input
              id="reg-displayname"
              type="text"
              className="field-input"
              placeholder={role === "provider" ? "Sharma Tiffin Centre" : "Rahul Sharma"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="reg-username" className="field-label">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              className="field-input"
              placeholder="only_letters_numbers_underscore"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              autoComplete="username"
              minLength={3}
              maxLength={30}
              required
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.3rem",
              }}
            >
              3–30 chars · letters, numbers, underscore only
            </p>
          </div>

          <div>
            <label htmlFor="reg-password" className="field-label">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div>
            <label htmlFor="reg-confirm-password" className="field-label">
              Confirm Password
            </label>
            <input
              id="reg-confirm-password"
              type="password"
              className="field-input"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            id="reg-submit"
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              marginTop: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {loading ? (
              <>
                <span className="spinner" /> Creating account…
              </>
            ) : (
              `Create ${role === "provider" ? "Provider" : "Customer"} Account`
            )}
          </button>
        </form>

        <div className="divider" style={{ margin: "1.5rem 0" }}>
          or
        </div>

        <p
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "var(--brand-orange)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-0)", color: "var(--text-muted)" }}>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
