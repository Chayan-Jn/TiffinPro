"use client";

import { useState, useEffect } from "react";
import { 
  FiCheckCircle, FiXCircle, FiClock, FiSearch, FiFilter
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
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "#fff", marginBottom: "0.5rem" }}>Business Ledger</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Audit trail for {logs.length} historical delivery records.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
           <button className="btn-ghost" style={{ padding: "0.75rem 1.25rem" }}><FiSearch /> Search</button>
           <button className="btn-ghost" style={{ padding: "0.75rem 1.25rem" }}><FiFilter /> Filters</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--s1)", border: "1px solid var(--bd)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--bd2)", background: "var(--s2)" }}>
                <th style={{ padding: "1.25rem 2rem", fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Service Date</th>
                <th style={{ padding: "1.25rem 2rem", fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Customer Detail</th>
                <th style={{ padding: "1.25rem 2rem", fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.15em" }}>Meal Name</th>
                <th style={{ padding: "1.25rem 2rem", fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "center" }}>Qty</th>
                <th style={{ padding: "1.25rem 2rem", fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.15em", textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "10rem", textAlign: "center" }}><span className="spinner" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "10rem", textAlign: "center", color: "var(--t4)", fontSize: "1.1rem", fontWeight: 600 }}>No historical records available.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: "1px solid var(--bd)", transition: "all 0.2s" }} className="hover-bg-light">
                    <td style={{ padding: "1.5rem 2rem", fontSize: "1rem", fontWeight: 800, color: "#fff" }}>
                      {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "1.5rem 2rem" }}>
                      <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff", marginBottom: "0.2rem" }}>{log.customerId?.displayName || "Manual Entry"}</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--brand)", fontWeight: 800 }}>@{log.customerId?.userId?.username || "offline_user"}</div>
                    </td>
                    <td style={{ padding: "1.5rem 2rem" }}>
                      <span style={{ fontSize: "0.95rem", color: "var(--t2)", fontWeight: 700, padding: "0.4rem 0.8rem", background: "var(--s2)", borderRadius: 8, border: "1px solid var(--bd)" }}>
                        {log.mealName}
                      </span>
                    </td>
                    <td style={{ padding: "1.5rem 2rem", textAlign: "center" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 950, color: log.status === "cancelled" ? "var(--t4)" : "var(--brand)" }}>
                        {log.quantity}
                      </span>
                    </td>
                    <td style={{ padding: "1.5rem 2rem", textAlign: "right" }}>
                      {log.status === "delivered" && (
                        <span className="badge" style={{ color: "var(--green)", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.4rem 0.8rem" }}>
                          <FiCheckCircle style={{ marginRight: "0.4rem" }} /> Delivered
                        </span>
                      )}
                      {log.status === "cancelled" && (
                        <span className="badge" style={{ color: "var(--red)", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", padding: "0.4rem 0.8rem" }}>
                          <FiXCircle style={{ marginRight: "0.4rem" }} /> Cancelled
                        </span>
                      )}
                      {log.status === "pending" && (
                        <span className="badge" style={{ color: "var(--amber)", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "0.4rem 0.8rem" }}>
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
    </div>
  );
}
