"use client";

import { useState, useEffect } from "react";
import { 
  FiClock, FiCheckCircle, FiAlertCircle, FiFileText,
  FiZap
} from "react-icons/fi";
import { toast } from "react-hot-toast";

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
    try {
      const [invRes, dueRes, custRes] = await Promise.all([
        fetch("/api/provider/billing"),
        fetch("/api/provider/billing/generate"),
        fetch("/api/provider/customers"),
      ]);
      if (invRes.ok) setInvoices((await invRes.json()).invoices || []);
      if (dueRes.ok) setDueCustomers((await dueRes.json()).dueCustomers || []);
      if (custRes.ok) setAllCustomers((await custRes.json()).records || []);
    } catch {
      toast.error("Failed to fetch billing data.");
    } finally {
      setLoading(false);
    }
  }

  async function generateBills() {
    if (dueCustomers.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/provider/billing/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerIds: dueCustomers.map(c => c._id) }),
      });
      if (res.ok) {
        toast.success("Invoices generated!");
        await fetchData();
      }
    } catch {
      toast.error("Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function verifyPayment(invoiceId: string) {
    try {
      const res = await fetch(`/api/provider/billing/${invoiceId}/verify`, { method: "PATCH" });
      if (res.ok) {
        toast.success("Payment verified.");
        await fetchData();
      }
    } catch {
      toast.error("Verification failed.");
    }
  }

  const uploadedInvoices = invoices.filter(i => i.status === "uploaded");
  const pendingInvoices = invoices.filter(i => i.status === "pending");
  const ongoingCustomers = allCustomers.filter(c => (c.mealPlan?.mealQuota ?? 0) > 0 && (c.mealPlan?.mealsConsumed ?? 0) < c.mealPlan?.mealQuota);

  return (
    <div style={{ minHeight: "100%" }} className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>Billing</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Invoices, payments, and quota tracking.</p>
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.5rem" }} onClick={generateBills} disabled={generating || dueCustomers.length === 0}>
          {generating ? <span className="spinner" /> : <><FiZap /> Generate Bills ({dueCustomers.length})</>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}><span className="spinner" /></div>
        ) : (
          <>
            {/* Verification Queue */}
            {uploadedInvoices.length > 0 && (
              <section className="card" style={{ border: "1px solid var(--brand-primary)", background: "rgba(99, 102, 241, 0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                  <div style={{ width: 48, height: 48, background: "var(--brand-primary)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FiCheckCircle style={{ color: "#fff", fontSize: "1.5rem" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Verification Queue</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{uploadedInvoices.length} payments waiting for approval.</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {uploadedInvoices.map(inv => (
                    <div key={inv._id} style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                      <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0 }}>
                        <img src={inv.paymentProofUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </a>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>{inv.customerId?.displayName}</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--brand-primary)", fontWeight: 700 }}>₹{inv.totalAmount} • {inv.periodString}</p>
                      </div>
                      <button className="btn-primary" style={{ width: "auto", padding: "0.6rem 1.25rem", fontSize: "0.85rem" }} onClick={() => verifyPayment(inv._id)}>Verify & Approve</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quota Progress & Overdue */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <FiAlertCircle style={{ color: "var(--brand-error)" }} /> Overdue Quotas
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {dueCustomers.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>All quotas are up to date.</p> :
                    dueCustomers.map(c => (
                      <div key={c._id} style={{ padding: "1rem", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#fff" }}>{c.displayName}</span>
                        <span style={{ fontWeight: 800, color: "var(--brand-error)" }}>₹{c.mealPlan?.rate}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <FiZap style={{ color: "var(--brand-primary)" }} /> Consumption Tracking
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {ongoingCustomers.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>No active subscriptions.</p> :
                    ongoingCustomers.slice(0, 5).map(c => {
                      const prog = ((c.mealPlan?.mealsConsumed ?? 0) / (c.mealPlan?.mealQuota || 1)) * 100;
                      return (
                        <div key={c._id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                            <span style={{ color: "#fff" }}>{c.displayName}</span>
                            <span style={{ color: "var(--text-muted)" }}>{c.mealPlan?.mealsConsumed} / {c.mealPlan?.mealQuota} Meals</span>
                          </div>
                          <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${prog}%`, background: "var(--brand-primary)", borderRadius: 3, boxShadow: "0 0 8px var(--brand-primary)" }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <section className="card">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <FiFileText style={{ color: "var(--brand-primary)" }} /> Pending Payments
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {pendingInvoices.length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No pending invoices found.</p> :
                  pendingInvoices.map(inv => (
                    <div key={inv._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", background: "var(--surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-primary)" }}><FiClock /></div>
                        <div>
                          <p style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>{inv.customerId?.displayName}</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{inv.periodString}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                        <span style={{ fontWeight: 900, color: "var(--brand-primary)", fontSize: "1.1rem" }}>₹{inv.totalAmount}</span>
                        <button className="btn-primary" style={{ background: "var(--surface-3)", border: "none", width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem" }} onClick={() => setEditingInvoice(inv)}>Manage</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </section>
          </>
        )}
      </div>

      {editingInvoice && (
        <div className="modal-overlay" onClick={() => setEditingInvoice(null)}>
          <div className="card animate-scale-in" style={{ maxWidth: 400, width: "100%", padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: "2rem" }}>Manage Invoice</h2>
            <div style={{ marginBottom: "2rem" }}>
              <label className="field-label">Total Amount (₹)</label>
              <input className="field-input" type="number" defaultValue={editingInvoice.totalAmount} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button className="btn-primary" onClick={() => { verifyPayment(editingInvoice._id); setEditingInvoice(null); }}>
                Mark as Paid (Cash)
              </button>
              <button className="btn-primary" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#fff" }} onClick={() => setEditingInvoice(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
