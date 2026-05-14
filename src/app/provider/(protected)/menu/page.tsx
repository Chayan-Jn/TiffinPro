"use client";

import { useState, useEffect } from "react";
import {
  FiCalendar, FiImage, FiPlus, 
  FiTrash2, FiUpload, FiX, FiSave,
  FiClipboard
} from "react-icons/fi";
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
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Menu</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Define what&apos;s cooking today.</p>
        </div>
        <button className="btn-primary" style={{ padding: "0.8rem 1.75rem" }} onClick={saveDailyMenu} disabled={savingMenu}>
          {savingMenu ? <span className="spinner" /> : <><FiSave /> Save Menu</>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "1000px" }}>
        
        {/* Master Menu Image */}
        <section className="card" style={{ background: "var(--s1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
            <div style={{ width: 48, height: 48, background: "rgba(255,107,53,0.08)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}>
              <FiImage style={{ fontSize: "1.5rem" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Master Menu</h2>
              <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>Upload a photo of your standard weekly menu.</p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2.5rem", alignItems: "start" }}>
            <label style={{ 
              border: "2px dashed var(--bd)", borderRadius: "var(--r2)", 
              padding: "4rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", 
              cursor: "pointer", background: "var(--s2)", transition: "all 0.3s"
            }}>
              <FiUpload style={{ fontSize: "2.5rem", color: "var(--t4)", marginBottom: "1.5rem" }} />
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}>{uploading ? "Uploading..." : "Select Menu Image"}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--t4)", marginTop: "0.6rem", fontWeight: 600 }}>JPG or PNG (Max 5MB)</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />
            </label>

            {menuImageUrl ? (
              <div style={{ position: "relative" }}>
                <img src={menuImageUrl} alt="Menu" style={{ width: "100%", height: "240px", objectFit: "cover", borderRadius: "var(--r2)", border: "1px solid var(--bd)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }} />
                <button onClick={() => setMenuImageUrl("")} style={{ position: "absolute", top: -12, right: -12, background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 16px rgba(0,0,0,0.4)" }}><FiX /></button>
              </div>
            ) : (
              <div style={{ height: "240px", border: "1px solid var(--bd)", borderRadius: "var(--r2)", background: "var(--s2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t4)", fontWeight: 700, fontSize: "0.9rem" }}>
                No image uploaded
              </div>
            )}
          </div>
        </section>

        {/* Daily Menu Items */}
        <section className="card" style={{ background: "var(--s1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,107,53,0.08)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}>
                <FiClipboard style={{ fontSize: "1.5rem" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Daily Specials</h2>
                <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>Update specific dishes for each day.</p>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <FiCalendar style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--brand)", pointerEvents: "none", zIndex: 5 }} />
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "190px", paddingLeft: "3.25rem", height: "46px" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {loadingMenu ? (
              <div style={{ textAlign: "center", padding: "3rem" }}><span className="spinner" /></div>
            ) : (
              <>
                {items.map((item, idx) => (
                  <div key={idx} className="animate-fade-up" style={{ background: "var(--s2)", padding: "1.75rem", borderRadius: "var(--r2)", border: "1px solid var(--bd)", display: "flex", gap: "1.5rem", alignItems: "flex-end" }}>
                    <div style={{ width: "180px" }}>
                      <label className="field-label" style={{ fontSize: "0.7rem" }}>Meal Type</label>
                      <input className="field-input" value={item.mealName} onChange={e => { const n = [...items]; n[idx].mealName = e.target.value; setItems(n); }} placeholder="e.g. Lunch" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label" style={{ fontSize: "0.7rem" }}>Dishes Included</label>
                      <input className="field-input" value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} placeholder="e.g. Aloo Matar, Dal Tadka, 4 Rotis" />
                    </div>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--red)", width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}><FiTrash2 /></button>
                  </div>
                ))}
                
                <button onClick={() => setItems([...items, { mealName: "", description: "" }])} className="btn-ghost" style={{ 
                  width: "100%", padding: "1.5rem", borderStyle: "dashed", borderWidth: "2px",
                  color: "var(--t3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
                }}>
                  <FiPlus /> Add Meal Category
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
