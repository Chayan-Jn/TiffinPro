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
        toast.success("Menu saved successfully!");
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
          <h1 style={{ fontSize: "2.5rem", fontWeight: 950, color: "#fff", marginBottom: "0.5rem" }}>Meal Menu</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Update your daily specials and master weekly menu.</p>
        </div>
        <button className="btn-primary" style={{ padding: "0.85rem 1.75rem" }} onClick={saveDailyMenu} disabled={savingMenu}>
          {savingMenu ? <span className="spinner" /> : <><FiSave /> Save Menu</>}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "3rem", maxWidth: "1000px" }}>
        
        {/* Master Menu Image */}
        <section className="card" style={{ background: "var(--s1)", padding: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2.5rem" }}>
            <div style={{ width: 48, height: 48, background: "rgba(255,107,53,0.08)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}>
              <FiImage style={{ fontSize: "1.5rem" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Master Menu Image</h2>
              <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>Static photo of your standard weekly offerings.</p>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "3rem", alignItems: "center" }}>
            <label style={{ 
              border: "2px dashed var(--bd)", borderRadius: "var(--r3)", 
              padding: "5rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", 
              cursor: "pointer", background: "var(--s2)", transition: "all 0.3s"
            }}>
              <FiUpload style={{ fontSize: "2.5rem", color: "var(--brand)", marginBottom: "1.5rem" }} />
              <span style={{ fontWeight: 900, fontSize: "1.25rem", color: "#fff" }}>{uploading ? "Uploading..." : "Upload Menu Image"}</span>
              <span style={{ fontSize: "0.9rem", color: "var(--t4)", marginTop: "0.6rem", fontWeight: 700 }}>PNG, JPG or WEBP (Max 5MB)</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />
            </label>

            {menuImageUrl ? (
              <div style={{ position: "relative", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                <img src={menuImageUrl} alt="Menu" style={{ width: "100%", height: "280px", objectFit: "cover", borderRadius: "var(--r3)", border: "4px solid var(--s2)" }} />
                <button onClick={() => setMenuImageUrl("")} style={{ position: "absolute", top: -15, right: -15, background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 8px 24px rgba(239,68,68,0.4)" }}><FiX style={{ fontSize: "1.4rem" }} /></button>
              </div>
            ) : (
              <div style={{ height: "280px", border: "1px solid var(--bd)", borderRadius: "var(--r3)", background: "var(--s2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--t4)", fontWeight: 800, fontSize: "1rem", gap: "1rem" }}>
                <FiImage style={{ fontSize: "3rem", opacity: 0.2 }} />
                No image uploaded
              </div>
            )}
          </div>
        </section>

        {/* Daily Menu Items */}
        <section className="card" style={{ background: "var(--s1)", padding: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ width: 48, height: 48, background: "rgba(255,107,53,0.08)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", border: "1px solid rgba(255,107,53,0.15)" }}>
                <FiClipboard style={{ fontSize: "1.5rem" }} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff" }}>Daily Specials</h2>
                <p style={{ color: "var(--t3)", fontSize: "0.95rem", fontWeight: 500 }}>Define dishes for specific calendar days.</p>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <FiCalendar style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "var(--brand)", pointerEvents: "none", zIndex: 5, fontSize: "1.1rem" }} />
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} style={{ width: "210px", paddingLeft: "3.5rem", height: "54px", fontWeight: 700, fontSize: "1.1rem" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {loadingMenu ? (
              <div style={{ textAlign: "center", padding: "5rem" }}><span className="spinner" /></div>
            ) : (
              <>
                {items.map((item, idx) => (
                  <div key={idx} className="animate-fade-up" style={{ background: "var(--s2)", padding: "2rem", borderRadius: "var(--r3)", border: "1px solid var(--bd)", display: "flex", gap: "1.5rem", alignItems: "flex-end" }}>
                    <div style={{ width: "200px" }}>
                      <label className="field-label" style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Meal Category</label>
                      <input className="field-input" style={{ height: "50px", fontWeight: 800, color: "var(--brand)" }} value={item.mealName} onChange={e => { const n = [...items]; n[idx].mealName = e.target.value; setItems(n); }} placeholder="e.g. Lunch" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="field-label" style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Dishes Included</label>
                      <input className="field-input" style={{ height: "50px", fontWeight: 600, color: "#fff" }} value={item.description} onChange={e => { const n = [...items]; n[idx].description = e.target.value; setItems(n); }} placeholder="e.g. Aloo Matar, Dal Tadka, 4 Rotis" />
                    </div>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "var(--red)", width: 50, height: 50, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}><FiTrash2 style={{ fontSize: "1.2rem" }} /></button>
                  </div>
                ))}
                
                <button onClick={() => setItems([...items, { mealName: "", description: "" }])} className="btn-ghost" style={{ 
                  width: "100%", padding: "2rem", borderStyle: "dashed", borderWidth: "2px",
                  color: "var(--t3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem",
                  fontSize: "1.1rem", fontWeight: 800, borderRadius: "var(--r3)"
                }}>
                  <FiPlus /> Add New Meal Category
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
