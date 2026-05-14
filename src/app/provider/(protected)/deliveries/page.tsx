"use client";

import { useState, useEffect } from "react";
import { 
  LuMinus, LuPlus, LuCalendar, LuChefHat,
  LuCircleCheck, LuCircleX, LuRotateCcw
} from "react-icons/lu";
import { useRouter } from "next/navigation";

interface DeliveryCustomer {
  customerId: string;
  displayName: string;
  phone: string;
  status: "pending" | "delivered" | "cancelled" | "paused";
  logId: string | null;
  quantity?: number;
}

export default function ProviderDeliveriesPage() {
  const router = useRouter();

  // State
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  
  const [meal, setMeal] = useState("Lunch"); 
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
  const totalTiffins = deliveries.reduce((sum, d) => sum + (d.status === "cancelled" ? 0 : (d.quantity ?? 1)), 0);

  async function adjustQuantity(customerId: string, newQuantity: number) {
    if (newQuantity < 0) return;
    setUpdating(true);
    try {
      const res = await fetch("/api/provider/deliveries/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, date, mealName: meal, quantity: newQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setDeliveries(prev => prev.map(d => {
        if (d.customerId !== customerId) return d;
        let newStatus = d.status;
        if (newQuantity === 0 && d.status === "pending") newStatus = "cancelled";
        if (newQuantity > 0 && d.status === "cancelled") newStatus = "pending";
        return { ...d, quantity: newQuantity, status: newStatus };
      }));
    } catch (err: any) {
      setMsg("❌ " + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div style={{ minHeight: "100%" }}>
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--t1)", letterSpacing: "-0.02em" }}>
            Daily Deliveries
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-accent" onClick={markAllDelivered} disabled={updating || pendingCount === 0} style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", gap: "0.5rem" }}>
            <LuCircleCheck /> Mark All Delivered ({pendingCount})
          </button>
        </div>
      </div>

      <div style={{ padding: "1.75rem", maxWidth: "1000px" }}>
        
        {/* Controls Bar */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--bd2)", borderRadius: "var(--r3)", padding: "1.25rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <label className="lbl" style={{ fontSize: "0.65rem", marginBottom: "0.2rem" }}>Service Date</label>
              <div style={{ position: "relative" }}>
                <LuCalendar style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--t3)", pointerEvents: "none" }} />
                <input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto", paddingLeft: "2.25rem", fontSize: "0.85rem", height: "38px" }} />
              </div>
            </div>

            <div>
              <label className="lbl" style={{ fontSize: "0.65rem", marginBottom: "0.2rem" }}>Select Meal</label>
              <select className="inp" value={meal} onChange={e => setMeal(e.target.value)} style={{ width: "auto", fontSize: "0.85rem", height: "38px" }}>
                {commonMeals.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ textAlign: "right", background: "var(--s2)", padding: "0.5rem 1.25rem", borderRadius: "var(--r2)", border: "1px solid var(--bd2)" }}>
            <div style={{ fontSize: "0.65rem", color: "var(--t3)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Tiffins</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--accent)" }}>{totalTiffins}</div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}><span className="spin" /></div>
        ) : deliveries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--s1)", border: "1px solid var(--bd2)", borderRadius: "var(--r3)" }}>
            <LuChefHat style={{ fontSize: "3.5rem", color: "var(--bd)", marginBottom: "1.5rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--t1)", marginBottom: "0.5rem" }}>No deliveries scheduled</h3>
            <p style={{ color: "var(--t3)", fontSize: "0.9rem" }}>There are no active customers for {meal} on this date.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {deliveries.map(d => (
              <div key={d.customerId} style={{
                background: "var(--s1)", border: "1px solid var(--bd2)", borderRadius: "var(--r2)", padding: "1rem 1.5rem",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
                borderColor: d.status === "delivered" ? "rgba(34,197,94,0.3)" : "var(--bd2)"
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--t1)", display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    {d.displayName}
                    {d.status === "cancelled" && <span style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)", padding: "1px 6px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 800 }}>SKIPPED</span>}
                    {(d.quantity ?? 1) > 1 && <span style={{ background: "rgba(255,69,0,0.1)", color: "var(--accent)", padding: "1px 6px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 800 }}>+{(d.quantity ?? 1) - 1} EXTRA</span>}
                  </div>
                  {d.phone && <div style={{ color: "var(--t3)", fontSize: "0.8rem", marginTop: "0.15rem" }}>{d.phone}</div>}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                  {/* Quantity */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "var(--s2)", padding: "0.3rem", borderRadius: "var(--r1)", border: "1px solid var(--bd2)" }}>
                    <button disabled={updating || (d.quantity ?? 1) === 0} onClick={() => adjustQuantity(d.customerId, (d.quantity ?? 1) - 1)} className="btn-icon" style={{ width: 22, height: 22, background: "var(--s1)" }}><LuMinus /></button>
                    <span style={{ fontWeight: 900, width: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--t1)" }}>{d.quantity ?? 1}</span>
                    <button disabled={updating} onClick={() => adjustQuantity(d.customerId, (d.quantity ?? 1) + 1)} className="btn-icon" style={{ width: 22, height: 22, background: "var(--s1)" }}><LuPlus /></button>
                  </div>

                  {d.status === "pending" && (d.quantity ?? 1) > 0 ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button onClick={() => updateStatus([d.customerId], "delivered")} disabled={updating} className="btn btn-ghost" style={{ fontSize: "0.75rem", color: "var(--green)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <LuCircleCheck /> Delivered
                      </button>
                      <button onClick={() => updateStatus([d.customerId], "cancelled")} disabled={updating} className="btn btn-ghost" style={{ fontSize: "0.75rem", color: "var(--red)" }}>
                        <LuCircleX /> Skip
                      </button>
                    </div>
                  ) : d.status === "delivered" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ color: "var(--green)", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.3rem" }}><LuCircleCheck /> DELIVERED</span>
                      <button onClick={() => updateStatus([d.customerId], "pending")} disabled={updating} className="btn-icon" title="Undo"><LuRotateCcw /></button>
                    </div>
                  ) : d.status === "cancelled" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ color: "var(--red)", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.3rem" }}><LuCircleX /> SKIPPED</span>
                      <button onClick={() => updateStatus([d.customerId], "pending")} disabled={updating} className="btn-icon" title="Undo"><LuRotateCcw /></button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
