"use client";

import { useState, useEffect } from "react";

export default function ProviderBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [dueCustomers, setDueCustomers] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [invRes, dueRes, custRes] = await Promise.all([
      fetch("/api/provider/billing"),
      fetch("/api/provider/billing/generate"),
      fetch("/api/provider/customers"),
    ]);
    
    if (invRes.ok) {
      const data = await invRes.json();
      setInvoices(data.invoices || []);
    }
    if (dueRes.ok) {
      const data = await dueRes.json();
      setDueCustomers(data.dueCustomers || []);
    }
    if (custRes.ok) {
      const data = await custRes.json();
      setAllCustomers(data.records || []);
    }
    setLoading(false);
  }

  async function generateBills() {
    if (dueCustomers.length === 0) return;
    setGenerating(true);
    const customerIds = dueCustomers.map(c => c._id);
    
    const res = await fetch("/api/provider/billing/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerIds }),
    });
    
    if (res.ok) {
      await fetchData(); // Refresh data
    }
    setGenerating(false);
  }

  async function verifyPayment(invoiceId: string) {
    const res = await fetch(`/api/provider/billing/${invoiceId}/verify`, {
      method: "PATCH",
    });
    if (res.ok) {
      await fetchData(); // Refresh data
    }
  }

  const uploadedInvoices = invoices.filter(i => i.status === "uploaded");
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const paidInvoices = invoices.filter(i => i.status === "paid");

  // Ongoing customers: Have a quota, but haven't finished it yet
  const ongoingCustomers = allCustomers.filter(c => (c.mealPlan?.mealQuota ?? 0) > 0 && (c.mealPlan?.mealsConsumed ?? 0) < c.mealPlan?.mealQuota);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-0)" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🍱</span>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", background: "linear-gradient(135deg, #fff, var(--brand-amber))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>TiffinPro</span>
          <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--brand-orange)", background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase" }}>Provider</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/provider/dashboard" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 500 }}>← Back to Dashboard</a>
        </div>
      </nav>

      <div style={{ padding: "2rem", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.25rem" }}>Billing & Payments</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Manage customer invoices and verify payments</p>
        </div>
      </div>

      {loading ? (
        <p>Loading billing data...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Action Required: Verify Payments */}
          {uploadedInvoices.length > 0 && (
            <div style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--brand-orange)", marginBottom: "1rem" }}>
                ⚠️ Verification Queue ({uploadedInvoices.length})
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                Customers have uploaded payment screenshots. Verify them to mark their invoices as Paid.
              </p>
              
              <div style={{ display: "grid", gap: "1rem" }}>
                {uploadedInvoices.map(inv => (
                  <div key={inv._id} style={{ background: "var(--surface-0)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
                    <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0, display: "block" }}>
                      <img src={inv.paymentProofUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </a>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)" }}>{inv.customerId?.displayName || "Unknown Customer"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Amount: ₹{inv.totalAmount} • Period: {inv.periodString}</div>
                    </div>
                    <button className="btn-primary" onClick={() => verifyPayment(inv._id)} style={{ padding: "0.6rem 1.25rem" }}>
                      Verify & Approve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Customers (Needs Bill Generated) */}
          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Overdue Customers</h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Customers whose meal quota is finished.</p>
              </div>
              <button 
                className="btn-primary" 
                onClick={generateBills}
                disabled={generating || dueCustomers.length === 0}
                style={{ padding: "0.6rem 1rem", opacity: dueCustomers.length === 0 ? 0.5 : 1 }}
              >
                {generating ? "Generating..." : `Generate Bills (${dueCustomers.length})`}
              </button>
            </div>
            
            {dueCustomers.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>All caught up! No overdue customers right now.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {dueCustomers.map(c => (
                  <div key={c._id} style={{ background: "var(--surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{c.displayName}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Quota: {c.mealPlan?.mealsConsumed ?? 0} / {c.mealPlan?.mealQuota ?? 0}</div>
                    <div style={{ color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: 700, marginTop: "0.5rem" }}>₹{c.mealPlan.rate}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ongoing Customers (Active Quota) */}
          <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>Ongoing Customers</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>Customers currently on an active quota.</p>
            
            {ongoingCustomers.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>No customers currently on an active quota.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {ongoingCustomers.map(c => {
                  const progress = ((c.mealPlan?.mealsConsumed ?? 0) / (c.mealPlan?.mealQuota || 1)) * 100;
                  return (
                    <div key={c._id} style={{ background: "var(--surface-0)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.5rem" }}>{c.displayName}</div>
                      
                      {/* Progress Bar */}
                      <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden", marginBottom: "0.4rem" }}>
                        <div style={{ height: "100%", width: `${progress}%`, background: "var(--brand-orange)", transition: "width 0.3s ease" }} />
                      </div>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: 600 }}>
                        <span>{c.mealPlan?.mealsConsumed ?? 0} Consumed</span>
                        <span>{c.mealPlan?.mealQuota} Total</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Invoices */}
          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>Pending Invoices</h2>
            {pendingInvoices.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No pending invoices.</p>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {pendingInvoices.map(inv => (
                  <div key={inv._id} style={{ background: "var(--surface-1)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{inv.customerId?.displayName || "Unknown"}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Period: {inv.periodString}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "var(--brand-orange)" }}>
                        ₹{inv.totalAmount}
                      </div>
                      <button className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} onClick={() => setEditingInvoice(inv)}>
                        Edit / Mark Paid
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
      
      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          onClose={() => setEditingInvoice(null)}
          onSaved={() => { setEditingInvoice(null); fetchData(); }}
        />
      )}
      </div>
    </div>
  );
}

// ─── Edit Invoice Modal ────────────────────────────────────────────────────────
function EditInvoiceModal({ invoice, onClose, onSaved }: { invoice: any; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount] = useState(invoice.totalAmount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function saveAmount() {
    setLoading(true); setError("");
    const res = await fetch(`/api/provider/billing/${invoice._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ totalAmount: Number(amount) }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update invoice.");
      return;
    }
    onSaved();
  }

  async function markPaid() {
    setLoading(true); setError("");
    const res = await fetch(`/api/provider/billing/${invoice._id}/verify`, { method: "PATCH" });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to mark as paid.");
      return;
    }
    onSaved();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "var(--surface-0)", padding: "1.5rem", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: 400, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Edit Invoice</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
        </div>
        
        {error && <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "0.75rem", borderRadius: "var(--radius-md)", marginBottom: "1rem", fontSize: "0.85rem" }}>{error}</div>}
        
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Total Amount (₹)</label>
          <input 
            type="number" 
            style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--text-primary)", fontSize: "1rem" }}
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
          />
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button 
            style={{ padding: "0.75rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
            onClick={saveAmount} disabled={loading}
          >
            {loading ? "Saving..." : "Save Amount Only"}
          </button>
          
          <button 
            style={{ padding: "0.75rem", background: "var(--brand-orange)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            onClick={markPaid} disabled={loading}
          >
            Mark as Paid (Cash / Direct)
          </button>
        </div>
      </div>
    </div>
  );
}
