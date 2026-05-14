"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface DeliveryCustomer {
  customerId: string;
  displayName: string;
  phone: string;
  status: "pending" | "delivered" | "cancelled" | "paused";
  logId: string | null;
}

export default function ProviderDeliveriesPage() {
  const router = useRouter();

  // State
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  
  const [meal, setMeal] = useState("Lunch"); // Default. Could be dynamic based on settings later.
  const [deliveries, setDeliveries] = useState<DeliveryCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");

  const commonMeals = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  useEffect(() => {
    fetchDeliveries();
  }, [date, meal]);

  async function fetchDeliveries() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/provider/deliveries?date=${date}&meal=${encodeURIComponent(meal)}`);
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(customerIds: string[], status: string) {
    if (customerIds.length === 0) return;
    setUpdating(true);
    setMsg("");

    try {
      const res = await fetch("/api/provider/deliveries/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, mealName: meal, customerIds, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(`✅ ${data.message}`);
      
      // Update local state
      setDeliveries(prev => prev.map(d => 
        customerIds.includes(d.customerId) ? { ...d, status: status as any } : d
      ));

      setTimeout(() => setMsg(""), 3000);
    } catch (err: any) {
      setMsg("❌ " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  const markAllDelivered = () => {
    const pendingIds = deliveries.filter(d => d.status === "pending").map(d => d.customerId);
    updateStatus(pendingIds, "delivered");
  };

  const pendingCount = deliveries.filter(d => d.status === "pending").length;
  const deliveredCount = deliveries.filter(d => d.status === "delivered").length;

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
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Deliveries</span>
        </div>
      </nav>

      <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* Controls */}
        <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label className="field-label" style={{ fontSize: "0.75rem", marginBottom: "0.2rem" }}>Date</label>
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto", padding: "0.5rem 1rem", fontWeight: 600 }} />
            </div>

            <div>
              <label className="field-label" style={{ fontSize: "0.75rem", marginBottom: "0.2rem" }}>Meal</label>
              <select className="field-input" value={meal} onChange={e => setMeal(e.target.value)} style={{ width: "auto", padding: "0.5rem 1rem", fontWeight: 600 }}>
                {commonMeals.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Tiffins</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-orange)" }}>{deliveries.length}</div>
            </div>
            <div style={{ width: 1, height: 30, background: "var(--border)" }}></div>
            <button className="btn-primary" onClick={markAllDelivered} disabled={updating || pendingCount === 0} style={{ width: "auto", padding: "0.75rem 1.5rem" }}>
              ✅ Mark {pendingCount} Delivered
            </button>
          </div>
        </div>

        {/* Message */}
        {msg && <div style={{ textAlign: "center", fontWeight: 600, color: msg.includes("✅") ? "#34d399" : "#f87171" }}>{msg}</div>}

        {/* List */}
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Loading deliveries...</p>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍽️</div>
            <p style={{ fontSize: "1rem" }}>No active customers scheduled for {meal} on this date.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {deliveries.map(d => (
              <div key={d.customerId} style={{
                background: "var(--surface-1)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", padding: "1rem 1.5rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: "1rem", transition: "all 0.2s",
                borderColor: d.status === "delivered" ? "rgba(52,211,153,0.3)" : "var(--border)"
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>{d.displayName}</div>
                  {d.phone && <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.2rem" }}>📞 {d.phone}</div>}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {d.status === "delivered" && <span style={{ color: "#34d399", fontSize: "0.8rem", fontWeight: 700, marginRight: "0.5rem" }}>DELIVERED</span>}
                  {d.status === "cancelled" && <span style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 700, marginRight: "0.5rem" }}>CANCELLED</span>}
                  
                  {d.status !== "delivered" && (
                    <button onClick={() => updateStatus([d.customerId], "delivered")} disabled={updating}
                      style={{ background: "rgba(52,211,153,0.1)", color: "#10b981", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 6, padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                      Mark Delivered
                    </button>
                  )}
                  {d.status !== "cancelled" && (
                    <button onClick={() => updateStatus([d.customerId], "cancelled")} disabled={updating}
                      style={{ background: "transparent", color: "#f87171", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, padding: "0.4rem 0.8rem", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
