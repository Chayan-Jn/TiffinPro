"use client";

import { useState, useEffect } from "react";
import { 
  FiClock, FiCheckCircle, FiAlertCircle, FiFileText,
  FiZap, FiArrowRight, FiActivity
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
  // Show all active customers for tracking
  const activeCustomers = allCustomers.filter(c => c.tiffinStatus === "active");

  return (
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Billing</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Invoices, payments, and quota tracking.</p>
        </div>
        <button className="btn-primary" style={{ padding: "0.8rem 1.75rem" }} onClick={generateBills} disabled={generating || dueCustomers.length === 0}>
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
              <section className="card" style={{ borderColor: "rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
                  <div style={{ width: 48, height: 48, background: "var(--brand)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px var(--brand-glow)" }}>
                    <FiCheckCircle style={{ color: "#fff", fontSize: "1.5rem" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Verification Queue</h2>
                    <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>{uploadedInvoices.length} payments waiting for your approval.</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {uploadedInvoices.map(inv => (
                    <div key={inv._id} className="card" style={{ background: "var(--s2)", border: "1px solid var(--bd)", display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.25rem" }}>
                      <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" style={{ width: 64, height: 64, borderRadius: 12, overflow: "hidden", border: "1px solid var(--bd)", flexShrink: 0 }}>
                        <img src={inv.paymentProofUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </a>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff" }}>{inv.customerId?.displayName}</h3>
                        <p style={{ fontSize: "0.9rem", color: "var(--brand)", fontWeight: 800 }}>₹{inv.totalAmount} • {inv.periodString}</p>
                      </div>
                      <button className="btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }} onClick={() => verifyPayment(inv._id)}>Verify & Approve</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quota Progress & Overdue */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "2rem" }}>
              <div className="card" style={{ background: "var(--s1)" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FiAlertCircle style={{ color: "var(--red)" }} /> Overdue Quotas
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {dueCustomers.length === 0 ? <p style={{ color: "var(--t4)", fontSize: "0.95rem", fontWeight: 600, textAlign: "center", padding: "2rem" }}>All accounts are current.</p> :
                    dueCustomers.map(c => (
                      <div key={c._id} style={{ padding: "1.25rem", background: "var(--s2)", borderRadius: "var(--r2)", border: "1px solid var(--bd)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontWeight: 800, color: "#fff" }}>{c.displayName}</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--t3)", fontWeight: 600 }}>Balance Due</p>
                        </div>
                        <span style={{ fontWeight: 950, color: "var(--red)", fontSize: "1.2rem" }}>₹{c.mealPlan?.rate}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card" style={{ background: "var(--s1)" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <FiActivity style={{ color: "var(--brand)" }} /> Consumption Tracking
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem" }}>
                  {activeCustomers.length === 0 ? <p style={{ color: "var(--t4)", fontSize: "0.95rem", fontWeight: 600, textAlign: "center", padding: "2rem" }}>No active tiffin customers.</p> :
                    activeCustomers.map(c => {
                      const quota = c.mealPlan?.mealQuota || 0;
                      const consumed = c.mealPlan?.mealsConsumed || 0;
                      const prog = quota > 0 ? Math.min((consumed / quota) * 100, 100) : 0;
                      
                      return (
                        <div key={c._id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.75rem" }}>
                            <span style={{ color: "#fff" }}>{c.displayName}</span>
                            <span style={{ color: prog > 90 ? "var(--red)" : "var(--t3)" }}>
                              {consumed} / {quota > 0 ? quota : "∞"} Meals
                            </span>
                          </div>
                          <div style={{ height: 8, background: "var(--s2)", borderRadius: 4, overflow: "hidden", border: "1px solid var(--bd)" }}>
                            <div style={{ 
                              height: "100%", 
                              width: quota > 0 ? `${prog}%` : "0%", 
                              background: prog > 90 ? "var(--red)" : "var(--brand)", 
                              borderRadius: 4,
                              boxShadow: quota > 0 ? `0 0 10px ${prog > 90 ? "var(--red)" : "var(--brand-glow)"}` : "none",
                              transition: "width 0.5s ease"
                            }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <section className="card" style={{ background: "var(--s1)" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <FiFileText style={{ color: "var(--brand)" }} /> Pending Invoices
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {pendingInvoices.length === 0 ? <p style={{ color: "var(--t4)", fontSize: "0.95rem", fontWeight: 600, textAlign: "center", padding: "3rem" }}>No pending invoices.</p> :
                  pendingInvoices.map(inv => (
                    <div key={inv._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.5rem", background: "var(--s2)", borderRadius: "var(--r2)", border: "1px solid var(--bd)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,107,53,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}><FiClock /></div>
                        <div>
                          <p style={{ fontWeight: 900, fontSize: "1.1rem", color: "#fff" }}>{inv.customerId?.displayName}</p>
                          <p style={{ fontSize: "0.85rem", color: "var(--t3)", fontWeight: 600 }}>{inv.periodString}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
                        <span style={{ fontWeight: 950, color: "#fff", fontSize: "1.3rem" }}>₹{inv.totalAmount}</span>
                        <button className="btn-ghost" style={{ padding: "0.6rem 1.25rem", fontSize: "0.85rem" }} onClick={() => setEditingInvoice(inv)}>Manage</button>
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
          <div className="auth-card animate-fade-up" style={{ maxWidth: 400, padding: "3rem" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "2rem" }}>Manage Invoice</h2>
            <div style={{ marginBottom: "2.5rem" }}>
              <label className="field-label">Total Amount (₹)</label>
              <input className="field-input" type="number" defaultValue={editingInvoice.totalAmount} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button className="btn-primary" style={{ height: "54px" }} onClick={() => { verifyPayment(editingInvoice._id); setEditingInvoice(null); }}>
                Mark as Paid (Cash)
              </button>
              <button className="btn-ghost" style={{ height: "54px" }} onClick={() => setEditingInvoice(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
