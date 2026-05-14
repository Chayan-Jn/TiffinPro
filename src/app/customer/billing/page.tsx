"use client";

import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function CustomerBilling() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{ url: string; upiId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/customer/billing");
    if (res.ok) {
      const data = await res.json();
      setInvoices(data.invoices || []);
    }
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, invoiceId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(invoiceId);
    try {
      const res = await fetch(`/api/customer/billing/${invoiceId}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl } = await res.json();
      if (!uploadUrl) throw new Error("Could not get upload URL");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      await fetchData(); // Refresh to show "uploaded" state
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    }
    setUploadingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const pendingInvoices = invoices.filter(i => i.status === "pending" || i.status === "uploaded");
  const paidInvoices = invoices.filter(i => i.status === "paid");

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
          <span style={{
            fontWeight: 800, fontSize: "1.1rem",
            background: "linear-gradient(135deg, #fff, var(--brand-amber))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>TiffinPro</span>
          <span style={{
            marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--brand-amber)", background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase",
          }}>Customer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/customer/home" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>← Back to Home</Link>
        </div>
      </nav>

      <main style={{ padding: "2.5rem 2rem", maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "2rem" }}>
          Billing & Payments
        </h1>

        {loading ? (
          <p>Loading your bills...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Pending Invoices */}
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Pending Bills</h2>
              {pendingInvoices.length === 0 ? (
                <div style={{ background: "var(--surface-1)", border: "1px dashed var(--border)", borderRadius: "var(--radius-lg)", padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>🎉</span>
                  You have no pending bills.
                </div>
              ) : (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  {pendingInvoices.map(inv => (
                    <div key={inv._id} style={{ background: "var(--surface-1)", border: `1px solid ${inv.status === 'pending' ? '#f87171' : 'var(--border)'}`, borderRadius: "var(--radius-lg)", padding: "1.5rem", boxShadow: inv.status === 'pending' ? "0 4px 12px rgba(248,113,113,0.1)" : "none" }}>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{inv.providerId?.displayName}</div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "0.2rem" }}>Period: {inv.periodString}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: inv.status === 'pending' ? '#f87171' : 'var(--brand-orange)' }}>₹{inv.totalAmount}</div>
                          {inv.status === "uploaded" ? (
                            <span style={{ display: "inline-block", background: "rgba(249,115,22,0.1)", color: "var(--brand-orange)", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, marginTop: "0.25rem" }}>Verifying</span>
                          ) : (
                            <span style={{ display: "inline-block", background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4, marginTop: "0.25rem" }}>Unpaid</span>
                          )}
                        </div>
                      </div>

                      {inv.status === "pending" ? (
                        <div style={{ background: "var(--surface-0)", borderRadius: "var(--radius-md)", padding: "1rem", border: "1px solid var(--border)" }}>
                          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                            Pay via UPI to <strong>{inv.providerId?.paymentUpiId || "provider"}</strong> and upload the screenshot.
                          </p>
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            {inv.providerId?.paymentQrUrl && (
                              <img 
                                src={inv.providerId.paymentQrUrl} 
                                alt="QR Code" 
                                style={{ width: 100, height: 100, objectFit: "contain", background: "#fff", borderRadius: 8, padding: 4, cursor: "pointer", border: "1px solid var(--border)" }} 
                                onClick={() => setQrModalData({ url: inv.providerId.paymentQrUrl, upiId: inv.providerId.paymentUpiId || "provider" })}
                              />
                            )}
                            <div style={{ flex: 1 }}>
                              <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={(e) => handleUpload(e, inv._id)} />
                              <button 
                                className="btn-primary" 
                                style={{ width: "100%", padding: "0.8rem" }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingId === inv._id}
                              >
                                {uploadingId === inv._id ? "Uploading Proof..." : "Upload Payment Proof"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", color: "#34d399", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span>⏳</span> Proof uploaded successfully. Waiting for provider to verify.
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paid Invoices */}
            {paidInvoices.length > 0 && (
              <div>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-secondary)" }}>Past Payments</h2>
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {paidInvoices.map(inv => (
                    <div key={inv._id} style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{inv.providerId?.displayName}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{inv.periodString}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>₹{inv.totalAmount}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {qrModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem" }} onClick={() => setQrModalData(null)}>
          <div style={{ background: "var(--surface-0)", padding: "2rem", borderRadius: "var(--radius-lg)", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Scan to Pay</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>UPI ID: <strong>{qrModalData.upiId}</strong></p>
            
            <div style={{ background: "#fff", padding: "1rem", borderRadius: "var(--radius-md)", display: "inline-block", marginBottom: "1.5rem" }}>
              <img src={qrModalData.url} alt="Large QR Code" style={{ width: "100%", maxWidth: 300, height: "auto", display: "block" }} />
            </div>
            
            <button className="btn-secondary" style={{ width: "100%", padding: "0.8rem" }} onClick={() => setQrModalData(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
