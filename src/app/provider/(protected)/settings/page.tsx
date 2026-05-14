"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FiCreditCard, FiUpload, FiX, 
  FiSave, FiInfo, FiCamera, FiLink
} from "react-icons/fi";
import { LuQrCode } from "react-icons/lu";
import { toast } from "react-hot-toast";

export default function ProviderSettings() {
  const [upiId, setUpiId] = useState("");
  const [qrUrl, setQrUrl] = useState(""); 
  const [qrKey, setQrKey] = useState(""); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/provider/settings/payment")
      .then(r => r.json())
      .then(d => {
        setUpiId(d.paymentUpiId || "");
        setQrUrl(d.paymentQrUrl || "");
        setQrKey(d.paymentQrKey || "");
      })
      .catch(() => toast.error("Failed to load settings."))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await fetch("/api/provider/settings/payment/presigned-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, key } = await res.json();
      if (!uploadUrl) throw new Error("Could not get upload URL");
      const uploadRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const saveRes = await fetch("/api/provider/settings/payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentQrUrl: key }),
      });
      const saveData = await saveRes.json();
      setQrUrl(saveData.paymentQrUrl);
      setQrKey(key);
      toast.success("QR Code uploaded successfully!");
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setUploading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/provider/settings/payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentUpiId: upiId }),
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
      } else {
        toast.error("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "#fff", marginBottom: "0.5rem" }}>Settings</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Configure your payment and business profile.</p>
        </div>
        <button className="btn-primary" style={{ padding: "0.85rem 1.75rem" }} onClick={saveSettings} disabled={saving}>
          {saving ? <span className="spinner" /> : <><FiSave /> Save Changes</>}
        </button>
      </div>

      <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "10rem" }}><span className="spinner" /></div>
        ) : (
          <>
            {/* UPI ID Section */}
            <section className="card" style={{ background: "var(--s1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2.5rem" }}>
                <div style={{ width: 48, height: 48, background: "rgba(255,107,53,0.08)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}>
                  <FiCreditCard style={{ fontSize: "1.5rem" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Payment Acceptance</h2>
                  <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>Receive direct UPI payments from subscribers.</p>
                </div>
              </div>
              
              <div>
                <label className="field-label" style={{ fontWeight: 900, fontSize: "0.75rem", color: "var(--t2)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>UPI ID (VPA)</label>
                <div style={{ position: "relative" }}>
                  <FiLink style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "var(--brand)", fontSize: "1.1rem" }} />
                  <input 
                    className="field-input" 
                    style={{ paddingLeft: "3.5rem", height: "60px", fontSize: "1.1rem", fontWeight: 700 }} 
                    placeholder="e.g. username@upi" 
                    value={upiId} 
                    onChange={e => setUpiId(e.target.value)} 
                  />
                </div>
                <div style={{ marginTop: "1.25rem", padding: "1rem", background: "var(--s2)", borderRadius: 12, border: "1px solid var(--bd)", display: "flex", gap: "0.8rem" }}>
                   <FiInfo style={{ color: "var(--brand)", marginTop: "0.1rem" }} />
                   <p style={{ fontSize: "0.85rem", color: "var(--t3)", fontWeight: 500 }}>This ID will be used for all one-click payment links generated for your customers.</p>
                </div>
              </div>
            </section>

            {/* QR Code Section */}
            <section className="card" style={{ background: "var(--s1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2.5rem" }}>
                <div style={{ width: 48, height: 48, background: "rgba(255,107,53,0.08)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}>
                  <LuQrCode style={{ fontSize: "1.5rem" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Display QR Code</h2>
                  <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>Upload your static UPI QR code for visual verification.</p>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
                {qrUrl ? (
                  <div style={{ position: "relative", padding: "1.5rem", background: "#fff", borderRadius: "var(--r3)", border: "4px solid var(--s2)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                    <img src={qrUrl} alt="QR" style={{ width: "280px", height: "280px", objectFit: "contain" }} />
                    <button 
                      onClick={() => { setQrUrl(""); setQrKey(""); }} 
                      style={{ 
                        position: "absolute", top: -15, right: -15, background: "var(--red)", color: "#fff", 
                        border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", 
                        alignItems: "center", justifyContent: "center", cursor: "pointer", 
                        boxShadow: "0 8px 24px rgba(239,68,68,0.4)", transition: "all 0.2s"
                      }}
                    >
                      <FiX style={{ fontSize: "1.4rem" }} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    style={{ 
                      width: "100%", border: "2px dashed var(--bd)", borderRadius: "var(--r3)", 
                      padding: "5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", 
                      cursor: "pointer", background: "var(--s2)", transition: "all 0.3s"
                    }}
                  >
                    <div style={{ width: 72, height: 72, background: "rgba(255,107,53,0.05)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", border: "1px solid var(--bd)" }}>
                      <FiCamera style={{ fontSize: "2.5rem", color: "var(--t4)" }} />
                    </div>
                    <span style={{ fontWeight: 900, fontSize: "1.4rem", color: "#fff" }}>{uploading ? "Uploading QR..." : "Click to Upload QR Image"}</span>
                    <span style={{ fontSize: "0.95rem", color: "var(--t4)", marginTop: "0.75rem", fontWeight: 600 }}>JPG, PNG or WEBP (Max 5MB)</span>
                  </button>
                )}
                
                <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handleUpload} />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
