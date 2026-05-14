"use client";

import { useState, useEffect, useRef } from "react";
import { 
  FiCreditCard, FiQrCode, FiUpload, FiX, 
  FiSave, FiCheckCircle, FiInfo, FiSettings,
  FiImage, FiCamera, FiLink
} from "react-icons/fi";
import { useRouter } from "next/navigation";
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
        toast.success("Payment settings saved.");
      } else {
        toast.error("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: "100%" }} className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Configure your payment and business preferences.</p>
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.5rem" }} onClick={saveSettings} disabled={saving}>
          {saving ? <span className="spinner" /> : <><FiSave /> Save All Changes</>}
        </button>
      </div>

      <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}><span className="spinner" /></div>
        ) : (
          <>
            {/* UPI ID Section */}
            <section className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ width: 48, height: 48, background: "rgba(99, 102, 241, 0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-primary)" }}>
                  <FiCreditCard style={{ fontSize: "1.5rem" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Payment Acceptance</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Set your UPI details for receiving payments from customers.</p>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <label className="field-label">Your UPI ID (VPA)</label>
                  <div style={{ position: "relative" }}>
                    <FiLink style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input 
                      className="field-input" 
                      style={{ paddingLeft: "3rem" }} 
                      placeholder="e.g. business@okaxis" 
                      value={upiId} 
                      onChange={e => setUpiId(e.target.value)} 
                    />
                  </div>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.75rem", lineHeight: 1.5 }}>
                    Customers will use this ID to make direct UPI payments. Ensure this is correct to avoid payment failures.
                  </p>
                </div>
              </div>
            </section>

            {/* QR Code Section */}
            <section className="card">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ width: 48, height: 48, background: "rgba(99, 102, 241, 0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-primary)" }}>
                  <FiQrCode style={{ fontSize: "1.5rem" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Display QR Code</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Upload your static UPI QR code for easier payments.</p>
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
                {qrUrl ? (
                  <div style={{ position: "relative", padding: "1.5rem", background: "#fff", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>
                    <img src={qrUrl} alt="QR" style={{ width: "260px", height: "260px", objectFit: "contain" }} />
                    <button 
                      onClick={() => { setQrUrl(""); setQrKey(""); }} 
                      style={{ 
                        position: "absolute", top: -12, right: -12, background: "var(--brand-error)", color: "#fff", 
                        border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", 
                        alignItems: "center", justifyContent: "center", cursor: "pointer", 
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <FiX style={{ fontSize: "1.2rem" }} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    style={{ 
                      width: "100%", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", 
                      padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", 
                      cursor: "pointer", background: "var(--surface-2)", transition: "all 0.3s",
                      borderColor: uploading ? "var(--brand-primary)" : "var(--border)"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand-primary)"}
                    onMouseLeave={e => !uploading && (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ width: 64, height: 64, background: "var(--surface-3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                      <FiCamera style={{ fontSize: "2rem", color: "var(--text-muted)" }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "1.25rem", color: "#fff" }}>{uploading ? "Uploading QR..." : "Click to Upload QR Image"}</span>
                    <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>Supported formats: JPG, PNG (Max 5MB)</span>
                  </button>
                )}
                
                <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handleUpload} />
                
                <div style={{ 
                  padding: "1.25rem", background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.2)", 
                  borderRadius: "var(--radius-md)", display: "flex", gap: "1rem", alignItems: "flex-start" 
                }}>
                  <FiInfo style={{ color: "var(--brand-primary)", fontSize: "1.25rem", marginTop: "0.2rem", flexShrink: 0 }} />
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    This QR code will be displayed to your customers when they pay via the TiffinPro app. 
                    Ensure it&apos;s a clear screenshot from your UPI app.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
