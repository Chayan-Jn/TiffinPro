"use client";

import { useState, useEffect } from "react";
import { 
  FiClock, FiCheckCircle, FiAlertCircle, FiFileText,
  FiZap, FiArrowRight, FiActivity, FiUser
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
  const activeCustomers = allCustomers.filter(c => c.tiffinStatus === "active");

  return (
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "#fff", marginBottom: "0.5rem" }}>Finance & Billing</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Track meal consumption, generate invoices, and verify payments.</p>
        </div>
        <button className="btn-primary" style={{ padding: "0.85rem 1.75rem" }} onClick={generateBills} disabled={generating || dueCustomers.length === 0}>
          {generating ? <span className="spinner" /> : <><FiZap /> Generate Bills ({dueCustomers.length})</>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "10rem" }}><span className="spinner" /></div>
        ) : (
          <>
            {/* Verification Queue */}
            {uploadedInvoices.length > 0 && (
              <section className="card" style={{ borderColor: "rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.05)", padding: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2.5rem" }}>
                  <div style={{ width: 50, height: 50, background: "var(--brand)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 20px var(--brand-glow)" }}>
                    <FiCheckCircle style={{ color: "#fff", fontSize: "1.5rem" }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>Payment Approvals</h2>
                    <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 600 }}>{uploadedInvoices.length} receipts pending verification.</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.25rem" }}>
                  {uploadedInvoices.map(inv => (
                    <div key={inv._id} className="card hover-lift-up" style={{ background: "var(--s1)", border: "1px solid var(--bd2)", display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem" }}>
                      <a href={inv.paymentProofUrl} target="_blank" rel="noreferrer" style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", border: "2px solid var(--s2)", flexShrink: 0 }}>
                        <img src={inv.paymentProofUrl} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </a>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 950, fontSize: "1.2rem", color: "#fff", marginBottom: "0.25rem" }}>{inv.customerId?.displayName}</h3>
                        <p style={{ fontSize: "1rem", color: "var(--brand)", fontWeight: 900 }}>₹{inv.totalAmount} <span style={{ color: "var(--t4)", fontSize: "0.8rem", fontWeight: 600 }}>• {inv.periodString}</span></p>
                      </div>
                      <button className="btn-primary" style={{ padding: "0.75rem 1.25rem", fontSize: "0.85rem", height: "auto" }} onClick={() => verifyPayment(inv._id)}>Approve</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Quota Progress & Overdue */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "2.5rem" }}>
              <div className="card" style={{ background: "var(--s1)", padding: "2.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 950, color: "#fff", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <FiAlertCircle style={{ color: "var(--red)", fontSize: "1.5rem" }} /> Overdue Accounts
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {dueCustomers.length === 0 ? <p style={{ color: "var(--t4)", fontSize: "1rem", fontWeight: 700, textAlign: "center", padding: "3rem" }}>Zero pending dues.</p> :
                    dueCustomers.map(c => (
                      <div key={c._id} style={{ padding: "1.5rem", background: "var(--s2)", borderRadius: "var(--r3)", border: "1px solid var(--bd2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ width: 40, height: 40, background: "rgba(239,68,68,0.05)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", border: "1px solid rgba(239,68,68,0.1)" }}><FiUser /></div>
                          <div>
                            <p style={{ fontWeight: 900, color: "#fff", fontSize: "1.1rem" }}>{c.displayName}</p>
                            <p style={{ fontSize: "0.75rem", color: "var(--t4)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Quota Finished</p>
                          </div>
                        </div>
                        <span style={{ fontWeight: 950, color: "var(--red)", fontSize: "1.4rem" }}>₹{c.mealPlan?.rate}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="card" style={{ background: "var(--s1)", padding: "2.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 950, color: "#fff", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <FiActivity style={{ color: "var(--brand)", fontSize: "1.5rem" }} /> Meal Tracking
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxHeight: "450px", overflowY: "auto", paddingRight: "0.75rem" }}>
                  {activeCustomers.length === 0 ? <p style={{ color: "var(--t4)", fontSize: "1rem", fontWeight: 700, textAlign: "center", padding: "3rem" }}>No active tiffin customers.</p> :
                    activeCustomers.map(c => {
                      const quota = c.mealPlan?.mealQuota || 0;
                      const consumed = c.mealPlan?.mealsConsumed || 0;
                      const prog = quota > 0 ? Math.min((consumed / quota) * 100, 100) : 0;
                      
                      return (
                        <div key={c._id}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1rem", fontWeight: 900, marginBottom: "0.8rem" }}>
                            <span style={{ color: "#fff" }}>{c.displayName}</span>
                            <span style={{ color: prog > 85 ? "var(--red)" : "var(--brand)", fontSize: "0.9rem" }}>
                              {consumed} / {quota > 0 ? quota : "∞"} <span style={{ color: "var(--t4)", fontSize: "0.75rem" }}>MEALS</span>
                            </span>
                          </div>
                          <div style={{ height: 10, background: "var(--s2)", borderRadius: 5, overflow: "hidden", border: "1px solid var(--bd2)" }}>
                            <div style={{ 
                              height: "100%", 
                              width: quota > 0 ? `${prog}%` : "10%", 
                              background: prog > 85 ? "linear-gradient(90deg, #ef4444, #f87171)" : "linear-gradient(90deg, var(--brand), #ff9f7d)", 
                              borderRadius: 5,
                              boxShadow: quota > 0 ? `0 0 15px ${prog > 85 ? "rgba(239,68,68,0.2)" : "var(--brand-glow)"}` : "none",
                              transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                            }} />
                          </div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>

            {/* Pending Invoices */}
            <section className="card" style={{ background: "var(--s1)", padding: "2.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 950, color: "#fff", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <FiFileText style={{ color: "var(--brand)", fontSize: "1.5rem" }} /> Unpaid Invoices
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.25rem" }}>
                {pendingInvoices.length === 0 ? <p style={{ color: "var(--t4)", fontSize: "1rem", fontWeight: 700, textAlign: "center", padding: "4rem", gridColumn: "1/-1" }}>No pending invoices found.</p> :
                  pendingInvoices.map(inv => (
                    <div key={inv._id} className="hover-lift-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.75rem", background: "var(--s2)", borderRadius: "var(--r3)", border: "1px solid var(--bd2)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,107,53,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}><FiClock /></div>
                        <div>
                          <p style={{ fontWeight: 950, fontSize: "1.15rem", color: "#fff" }}>{inv.customerId?.displayName}</p>
                          <p style={{ fontSize: "0.85rem", color: "var(--t4)", fontWeight: 700 }}>{inv.periodString}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                        <span style={{ fontWeight: 950, color: "#fff", fontSize: "1.4rem" }}>₹{inv.totalAmount}</span>
                        <button className="btn-ghost" style={{ padding: "0.7rem 1.25rem", fontSize: "0.85rem", fontWeight: 800 }} onClick={() => setEditingInvoice(inv)}>Manage</button>
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
        <div className="modal-overlay" style={{ backdropFilter: "blur(8px)" }} onClick={() => setEditingInvoice(null)}>
          <div className="auth-card animate-fade-up" style={{ maxWidth: 420, padding: "3.5rem", background: "var(--s1)", border: "1px solid var(--bd)" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 60, height: 60, background: "rgba(255,107,53,0.08)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", marginBottom: "2rem", border: "1px solid rgba(255,107,53,0.15)" }}>
              <FiZap style={{ fontSize: "1.8rem" }} />
            </div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 950, color: "#fff", marginBottom: "1rem", letterSpacing: "-0.04em" }}>Finalize Payment</h2>
            <p style={{ color: "var(--t3)", marginBottom: "2.5rem", fontWeight: 500, lineHeight: 1.5 }}>Update invoice total or mark as paid if received via cash or external UPI.</p>
            
            <div style={{ marginBottom: "2.5rem" }}>
              <label className="field-label" style={{ fontWeight: 900, color: "var(--t3)" }}>PAYABLE AMOUNT (₹)</label>
              <input className="field-input" style={{ height: "60px", fontSize: "1.5rem", fontWeight: 950, color: "var(--brand)" }} type="number" defaultValue={editingInvoice.totalAmount} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button className="btn-primary" style={{ height: "60px", fontSize: "1.1rem" }} onClick={() => { verifyPayment(editingInvoice._id); setEditingInvoice(null); }}>
                Confirm Payment
              </button>
              <button className="btn-ghost" style={{ height: "60px", fontWeight: 800 }} onClick={() => setEditingInvoice(null)}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
