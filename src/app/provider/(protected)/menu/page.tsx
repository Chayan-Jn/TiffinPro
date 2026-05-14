"use client";

import { useState, useEffect } from "react";
import {
  FiCalendar, FiImage, FiPlus, 
  FiTrash2, FiUpload, FiX, FiSave, FiCheckCircle, 
  FiClipboard
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface MenuItem {
  mealName: string;
  description: string;
}

export default function ProviderMenuPage() {
  const [menuImageUrl, setMenuImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [items, setItems] = useState<MenuItem[]>([
    { mealName: "Breakfast", description: "" },
    { mealName: "Lunch", description: "" },
    { mealName: "Dinner", description: "" }
  ]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [savingMenu, setSavingMenu] = useState(false);

  useEffect(() => {
    setLoadingMenu(true);
    fetch(`/api/provider/menu/daily?date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (data.menuImageUrl) setMenuImageUrl(data.menuImageUrl);
        if (data.menu?.items?.length > 0) {
          setItems(data.menu.items);
        } else {
          setItems([
            { mealName: "Breakfast", description: "" },
            { mealName: "Lunch", description: "" },
            { mealName: "Dinner", description: "" }
          ]);
        }
      })
      .catch(() => toast.error("Failed to load menu."))
      .finally(() => setLoadingMenu(false));
  }, [date]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File too large (Max 5MB)"); return; }
    setUploading(true);
    try {
      const presignRes = await fetch("/api/provider/menu/presigned-url", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error);
      const uploadRes = await fetch(presignData.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadRes.ok) throw new Error("Failed to upload image.");
      const saveRes = await fetch("/api/provider/menu/image", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuImageUrl: presignData.key }),
      });
      const saveResData = await saveRes.json();
      setMenuImageUrl(saveResData.menuImageUrl);
      toast.success("Menu image updated!");
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function saveDailyMenu() {
    setSavingMenu(true);
    try {
      const res = await fetch("/api/provider/menu/daily", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, items }),
      });
      if (res.ok) {
        toast.success("Daily menu saved!");
      } else {
        toast.error("Failed to save.");
      }
    } finally {
      setSavingMenu(false);
    }
  }

  return (
    <div style={{ minHeight: "100%" }} className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>Menu</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Define what&apos;s cooking today.</p>
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.5rem" }} onClick={saveDailyMenu} disabled={savingMenu}>
          {savingMenu ? <span className="spinner" /> : <><FiSave /> Save Daily Menu</>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        
        {/* Standard Menu Image */}
        <section className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ width: 48, height: 48, background: "rgba(99, 102, 241, 0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-primary)" }}>
              <FiImage style={{ fontSize: "1.5rem" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Master Menu Photo</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Upload a picture of your weekly/standard menu.</p>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <label style={{ 
              flex: 1, minWidth: "300px", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", 
              padding: "3rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", 
              cursor: "pointer", background: "var(--surface-2)", transition: "all 0.3s",
              borderColor: uploading ? "var(--brand-primary)" : "var(--border)"
            }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--brand-primary)"} onMouseLeave={e => !uploading && (e.currentTarget.style.borderColor = "var(--border)")}>
              <FiUpload style={{ fontSize: "2.5rem", color: "var(--text-muted)", marginBottom: "1rem" }} />
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>{uploading ? "Uploading..." : "Click to Upload Image"}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>JPG or PNG (Max 5MB)</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />
            </label>

            {menuImageUrl && (
              <div style={{ position: "relative" }}>
                <img src={menuImageUrl} alt="Menu" style={{ width: "240px", height: "180px", objectFit: "cover", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }} />
                <button onClick={() => setMenuImageUrl("")} style={{ position: "absolute", top: -12, right: -12, background: "var(--brand-error)", color: "#fff", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}><FiX /></button>
              </div>
            )}
          </div>
        </section>

        {/* Daily Menu Items */}
        <section className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, background: "rgba(99, 102, 241, 0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-primary)" }}>
                <FiClipboard style={{ fontSize: "1.5rem" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Daily Meal Details</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Update what&apos;s being served on a specific day.</p>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <FiCalendar style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "180px", paddingLeft: "3rem" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {loadingMenu ? (
              <div style={{ textAlign: "center", padding: "3rem" }}><span className="spinner" /></div>
            ) : (
              <>
                {items.map((item, idx) => (
                  <div key={idx} style={{ background: "var(--surface-2)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", gap: "1.5rem", alignItems: "flex-end" }} className="animate-fade-up">
                    <div style={{ width: "160px" }}>
                      <label className="field-label" style={{ fontSize: "0.75rem" }}>Meal Type</label>
                      <input className="field-input" value={item.mealName} onChange={e => { const n = [...items]; n[idx].mealName = e.target.value; setItems(n); }} placeholder="e.g. Lunch" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label" style={{ fontSize: "0.75rem" }}>What&apos;s on the menu?</label>
                      <input className="field-input" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} placeholder="e.g. Aloo Matar, Dal Tadka, Rice, 4 Rotis" />
                    </div>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--brand-error)", width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}><FiTrash2 /></button>
                  </div>
                ))}
                
                <button onClick={() => setItems([...items, { mealName: "", description: "" }])} style={{ 
                  width: "100%", padding: "1.25rem", background: "transparent", border: "2px dashed var(--border)", 
                  borderRadius: "var(--radius-md)", color: "var(--text-muted)", fontWeight: 700, fontSize: "0.95rem",
                  cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--brand-primary)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                  <FiPlus /> Add Another Meal Category
                </button>
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
