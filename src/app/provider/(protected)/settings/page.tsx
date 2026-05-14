"use client";

import { useState, useEffect, useRef } from "react";

export default function ProviderSettings() {
  const [upiId, setUpiId] = useState("");
  const [qrUrl, setQrUrl] = useState(""); // Signed URL for display
  const [qrKey, setQrKey] = useState(""); // Raw key for DB
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/provider/settings/payment")
      .then(r => r.json())
      .then(d => {
        setUpiId(d.paymentUpiId || "");
        setQrUrl(d.paymentQrUrl || "");
        setQrKey(d.paymentQrKey || "");
        setLoading(false);
      });
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg("");
    try {
      const res = await fetch("/api/provider/settings/payment/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, key } = await res.json();
      if (!uploadUrl) throw new Error("Could not get upload URL");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");

      // Auto-save the key to DB and get a fresh signed URL
      const saveRes = await fetch("/api/provider/settings/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentQrUrl: key }),
      });
      const saveData = await saveRes.json();
      
      setQrUrl(saveData.paymentQrUrl);
      setQrKey(key);
    } catch (err: any) {
      setMsg("❌ " + err.message);
    }
    setUploading(false);
  }

  async function saveSettings() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/provider/settings/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentUpiId: upiId }),
    });
    setSaving(false);
    if (res.ok) {
      setMsg("✅ Settings saved successfully!");
    } else {
      setMsg("❌ Failed to save settings.");
    }
  }

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

      <div style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>Payment Settings</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
        Configure your UPI ID and Payment QR Code so customers can pay you.
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem" }}>UPI ID</label>
            <input 
              type="text" 
              className="field-input" 
              placeholder="e.g. 9876543210@ybl" 
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
            />
          </div>

          <div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Payment QR Code</h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
              Upload a screenshot or image of your UPI QR code (Google Pay, PhonePe, Paytm).
            </p>

            {qrUrl ? (
              <div style={{ position: "relative", display: "inline-block", width: "100%", maxWidth: 350 }}>
                <img src={qrUrl} alt="QR Code" style={{ width: "100%", maxHeight: 350, objectFit: "contain", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-0)" }} />
                <button
                  onClick={async () => {
                    setQrUrl(""); setQrKey("");
                    await fetch("/api/provider/settings/payment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ paymentQrUrl: "" }),
                    });
                  }}
                  style={{ position: "absolute", top: -10, right: -10, background: "#ef4444", color: "#fff", border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div style={{ padding: "3rem", border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", textAlign: "center", background: "var(--surface-0)" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>📸</div>
                <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>No QR code uploaded yet.</p>
                <button className="btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload QR Code"}
                </button>
              </div>
            )}
            
            {/* Hidden file input */}
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: "none" }} 
              ref={fileInputRef}
              onChange={handleUpload}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
            <button 
              className="btn-primary" 
              style={{ width: "100%", padding: "0.8rem", fontSize: "1rem" }}
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Payment Settings"}
            </button>
            {msg && <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: msg.startsWith("✅") ? "#34d399" : "#f87171" }}>{msg}</p>}
          </div>

        </div>
      )}
      </div>
    </div>
  );
}
