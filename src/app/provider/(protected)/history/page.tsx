"use client";

import { useState, useEffect } from "react";
import { 
  FiCheckCircle, FiXCircle, FiClock
} from "react-icons/fi";
import { toast } from "react-hot-toast";

export default function ProviderHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/provider/history")
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || []);
      })
      .catch(() => toast.error("Failed to load history."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: "100%" }} className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>Ledger</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Historical record of {logs.length} tiffin deliveries.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
              <th style={{ padding: "1.25rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Service Date</th>
              <th style={{ padding: "1.25rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Customer</th>
              <th style={{ padding: "1.25rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Meal</th>
              <th style={{ padding: "1.25rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center" }}>Qty</th>
              <th style={{ padding: "1.25rem 1.5rem", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: "6rem", textAlign: "center" }}><span className="spinner" /></td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "6rem", textAlign: "center", color: "var(--text-muted)", fontSize: "1rem" }}>No history records found.</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "1.25rem 1.5rem", fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
                    {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff" }}>{log.customerId?.displayName || "Deleted Customer"}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--brand-primary)", fontWeight: 700 }}>@{log.customerId?.userId?.username || "manual"}</div>
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                    {log.mealName}
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem", textAlign: "center", fontSize: "1.1rem", fontWeight: 900, color: "var(--brand-primary)" }}>
                    {log.quantity}
                  </td>
                  <td style={{ padding: "1.25rem 1.5rem" }}>
                    {log.status === "delivered" && (
                      <span className="badge" style={{ color: "var(--brand-success)", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        <FiCheckCircle style={{ marginRight: "0.4rem" }} /> Delivered
                      </span>
                    )}
                    {log.status === "cancelled" && (
                      <span className="badge" style={{ color: "var(--brand-error)", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                        <FiXCircle style={{ marginRight: "0.4rem" }} /> Cancelled
                      </span>
                    )}
                    {log.status === "pending" && (
                      <span className="badge" style={{ color: "var(--brand-warning)", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                        <FiClock style={{ marginRight: "0.4rem" }} /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
