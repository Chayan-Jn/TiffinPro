"use client";

import { useState, useEffect } from "react";
import { 
  LuMinus, LuPlus, LuCalendar, LuChefHat,
  LuCircleCheck, LuCircleX, LuRotateCcw
} from "react-icons/lu";
import { toast } from "react-hot-toast";

interface DeliveryCustomer {
  customerId: string;
  displayName: string;
  phone: string;
  status: "pending" | "delivered" | "cancelled" | "paused";
  logId: string | null;
  quantity?: number;
}

export default function ProviderDeliveriesPage() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  
  const [meal, setMeal] = useState("Lunch"); 
  const [deliveries, setDeliveries] = useState<DeliveryCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const commonMeals = ["Breakfast", "Lunch", "Dinner", "Snacks"];

  useEffect(() => {
    fetchDeliveries();
  }, [date, meal]);

  async function fetchDeliveries() {
    setLoading(true);
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

    try {
      const res = await fetch("/api/provider/deliveries/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, mealName: meal, customerIds, status }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      
      setDeliveries(prev => prev.map(d => 
        customerIds.includes(d.customerId) ? { ...d, status: status as any } : d
      ));
    } catch (err: any) {
      toast.error(err.message);
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
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Deliveries</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Track and manage daily meal fulfillments.</p>
        </div>
        <button className="btn-primary" onClick={markAllDelivered} disabled={updating || pendingCount === 0} style={{ padding: "0.8rem 1.75rem" }}>
          <LuCircleCheck /> Deliver All ({pendingCount})
        </button>
      </div>

      <div style={{ maxWidth: "900px" }}>
        {/* Controls Bar */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--bd)", borderRadius: "var(--r2)", padding: "1.5rem", display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <label className="field-label" style={{ fontSize: "0.65rem", marginBottom: "0.4rem" }}>Service Date</label>
              <div style={{ position: "relative" }}>
                <LuCalendar style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand)", pointerEvents: "none" }} />
                <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "auto", paddingLeft: "2.5rem", height: "44px", fontSize: "0.9rem" }} />
              </div>
            </div>

            <div>
              <label className="field-label" style={{ fontSize: "0.65rem", marginBottom: "0.4rem" }}>Select Meal</label>
              <select className="field-input" value={meal} onChange={e => setMeal(e.target.value)} style={{ width: "auto", height: "44px", fontSize: "0.9rem", paddingRight: "2.5rem" }}>
                {commonMeals.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div style={{ textAlign: "right", padding: "0.6rem 1.5rem", background: "rgba(255,107,53,0.05)", borderRadius: "var(--r2)", border: "1px solid rgba(255,107,53,0.15)" }}>
            <div style={{ fontSize: "0.65rem", color: "var(--brand)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}>Active Tiffins</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 950, color: "#fff", lineHeight: 1.1 }}>{totalTiffins}</div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}><span className="spinner" /></div>
        ) : deliveries.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "6rem 2rem", borderStyle: "dashed", opacity: 0.8 }}>
            <LuChefHat style={{ fontSize: "3.5rem", color: "var(--t4)", marginBottom: "1.5rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>No deliveries scheduled</h3>
            <p style={{ color: "var(--t3)", fontWeight: 500 }}>There are no active customers for {meal} on this date.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {deliveries.map(d => (
              <div key={d.customerId} className="card" style={{
                padding: "1.25rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem",
                background: "var(--s1)", borderColor: d.status === "delivered" ? "rgba(34,197,94,0.3)" : "var(--bd)"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    {d.displayName}
                    {d.status === "cancelled" && <span style={{ background: "rgba(239,68,68,0.1)", color: "var(--red)", padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 900 }}>SKIPPED</span>}
                    {(d.quantity ?? 1) > 1 && <span style={{ background: "rgba(255,107,53,0.1)", color: "var(--brand)", padding: "2px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 900 }}>{d.quantity} TIFFINS</span>}
                  </div>
                  {d.phone && <div style={{ color: "var(--t3)", fontSize: "0.85rem", marginTop: "0.25rem", fontWeight: 500 }}>{d.phone}</div>}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  {/* Quantity Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--s2)", padding: "0.4rem", borderRadius: "12px", border: "1px solid var(--bd)" }}>
                    <button disabled={updating || (d.quantity ?? 1) <= 0} onClick={() => adjustQuantity(d.customerId, (d.quantity ?? 1) - 1)} className="btn-icon" style={{ width: 28, height: 28, background: "var(--s1)" }}><LuMinus /></button>
                    <span style={{ fontWeight: 950, width: "1.2rem", textAlign: "center", fontSize: "1rem", color: "#fff" }}>{d.quantity ?? 1}</span>
                    <button disabled={updating} onClick={() => adjustQuantity(d.customerId, (d.quantity ?? 1) + 1)} className="btn-icon" style={{ width: 28, height: 28, background: "var(--s1)" }}><LuPlus /></button>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", minWidth: "160px", justifyContent: "flex-end" }}>
                    {d.status === "pending" && (d.quantity ?? 1) > 0 ? (
                      <>
                        <button onClick={() => updateStatus([d.customerId], "delivered")} disabled={updating} className="btn-ghost" style={{ fontSize: "0.8rem", color: "var(--green)", borderColor: "rgba(34,197,94,0.2)", padding: "0.6rem 1rem" }}>
                          <LuCircleCheck /> Delivered
                        </button>
                        <button onClick={() => updateStatus([d.customerId], "cancelled")} disabled={updating} className="btn-ghost" style={{ fontSize: "0.8rem", color: "var(--red)", borderColor: "rgba(239, 68, 68, 0.2)", padding: "0.6rem 1rem" }}>
                          Skip
                        </button>
                      </>
                    ) : d.status === "delivered" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ color: "var(--green)", fontSize: "0.8rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem" }}><LuCircleCheck /> DELIVERED</span>
                        <button onClick={() => updateStatus([d.customerId], "pending")} disabled={updating} className="btn-icon" style={{ background: "var(--s2)" }} title="Undo"><LuRotateCcw /></button>
                      </div>
                    ) : d.status === "cancelled" ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ color: "var(--red)", fontSize: "0.8rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "0.4rem" }}><LuCircleX /> SKIPPED</span>
                        <button onClick={() => updateStatus([d.customerId], "pending")} disabled={updating} className="btn-icon" style={{ background: "var(--s2)" }} title="Undo"><LuRotateCcw /></button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
