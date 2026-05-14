"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProviderHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/history")
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || []);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-0)" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => router.push("/provider/dashboard")}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.9rem" }}>
            ← Dashboard
          </button>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Delivery Ledger</span>
        </div>
      </nav>

      <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Delivery History</h1>
          <p style={{ color: "var(--text-secondary)" }}>A complete ledger of every tiffin delivered, skipped, or cancelled. Use this to track exact consumption.</p>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Loading history...</p>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)", background: "var(--surface-1)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)" }}>
            <p>No delivery history found.</p>
          </div>
        ) : (
          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
              <thead style={{ background: "var(--surface-2)", color: "var(--text-secondary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <tr>
                  <th style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>Date</th>
                  <th style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>Customer</th>
                  <th style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>Meal</th>
                  <th style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", textAlign: "center" }}>Qty</th>
                  <th style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log._id} style={{ borderBottom: i === logs.length - 1 ? "none" : "1px solid var(--border)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {log.date}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{log.customerId?.displayName || "Unknown"}</div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "var(--text-secondary)" }}>
                      {log.mealName}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontWeight: 800 }}>
                      {log.quantity}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      {log.status === "delivered" && <span style={{ background: "rgba(52,211,153,0.1)", color: "#10b981", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700 }}>DELIVERED</span>}
                      {log.status === "cancelled" && <span style={{ background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700 }}>CANCELLED / SKIPPED</span>}
                      {log.status === "pending" && <span style={{ background: "rgba(249,115,22,0.1)", color: "var(--brand-orange)", padding: "4px 8px", borderRadius: 4, fontSize: "0.75rem", fontWeight: 700 }}>PENDING</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
