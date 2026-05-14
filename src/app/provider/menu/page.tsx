"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MenuItem {
  mealName: string;
  description: string;
}

export default function ProviderMenuPage() {
  const router = useRouter();

  // Image Upload State
  const [menuImageUrl, setMenuImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState("");

  // Daily Menu State
  const [date, setDate] = useState(() => {
    const today = new Date();
    // Format YYYY-MM-DD local time
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [items, setItems] = useState<MenuItem[]>([
    { mealName: "Breakfast", description: "" },
    { mealName: "Lunch", description: "" },
    { mealName: "Dinner", description: "" }
  ]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuMsg, setMenuMsg] = useState("");



  // Fetch daily menu when date changes
  useEffect(() => {
    setLoadingMenu(true);
    setMenuMsg("");
    fetch(`/api/provider/menu/daily?date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (data.menuImageUrl) setMenuImageUrl(data.menuImageUrl);
        if (data.menu?.items?.length > 0) {
          setItems(data.menu.items);
        } else {
          // Reset to default empty blocks if none exist
          setItems([
            { mealName: "Breakfast", description: "" },
            { mealName: "Lunch", description: "" },
            { mealName: "Dinner", description: "" }
          ]);
        }
        setLoadingMenu(false);
      })
      .catch(() => setLoadingMenu(false));
  }, [date]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImgError("File too large. Maximum size is 5MB.");
      return;
    }

    setUploading(true);
    setImgError("");

    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/provider/menu/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.error);

      // 2. Upload directly to B2
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload image to storage server.");

      // 3. Save key to profile
      const saveRes = await fetch("/api/provider/menu/image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuImageUrl: presignData.key }),
      });
      
      const saveResData = await saveRes.json();
      if (!saveRes.ok) throw new Error("Failed to save image URL to profile.");

      setMenuImageUrl(saveResData.menuImageUrl);
    } catch (err: any) {
      setImgError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
      // Clear input so they can re-select the same file if needed
      e.target.value = "";
    }
  }

  async function removeImage() {
    setUploading(true);
    try {
      await fetch("/api/provider/menu/image", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuImageUrl: "" }),
      });
      setMenuImageUrl("");
    } catch (err) {
      setImgError("Failed to remove image.");
    } finally {
      setUploading(false);
    }
  }

  async function saveDailyMenu() {
    setSavingMenu(true);
    setMenuMsg("");

    const res = await fetch("/api/provider/menu/daily", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, items }),
    });

    const data = await res.json();
    setSavingMenu(false);

    if (res.ok) {
      setMenuMsg("✅ Menu saved successfully!");
      // clear message after 3s
      setTimeout(() => setMenuMsg(""), 3000);
    } else {
      setMenuMsg("❌ " + (data.error || "Failed to save"));
    }
  }

  function addMealField() {
    setItems([...items, { mealName: "", description: "" }]);
  }

  function updateItem(index: number, field: "mealName" | "description", value: string) {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-0)" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button onClick={() => router.push("/provider/dashboard")}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.9rem" }}>
            ← Dashboard
          </button>
          <span style={{ color: "var(--border)" }}>|</span>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Menu Management</span>
        </div>
      </nav>

      <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Section 1: Static Mess Menu Photo */}
        <section style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Mess Menu Photo</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Upload a photo of your weekly or monthly mess menu. Customers will see this when they view your profile.
          </p>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <label style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                border: "2px dashed var(--border)", borderRadius: "var(--radius-md)", padding: "2rem",
                cursor: "pointer", background: "var(--surface-2)", transition: "all 0.2s"
              }}>
                <span style={{ fontSize: "2rem", marginBottom: "1rem" }}>📸</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {uploading ? "Uploading..." : "Click to upload new image"}
                </span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>JPG, PNG, WebP (Max 5MB)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ display: "none" }} />
              </label>
              {imgError && <div className="error-alert" style={{ marginTop: "1rem" }}>{imgError}</div>}
            </div>

            {loadingMenu ? (
              <div style={{ width: 200, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading image...</p>
              </div>
            ) : menuImageUrl ? (
              <div style={{ flexShrink: 0, position: "relative", minWidth: 150, maxWidth: 300 }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.5rem", color: "var(--text-secondary)" }}>Current Photo:</div>
                <img src={menuImageUrl} alt="Mess Menu" style={{ width: "100%", maxHeight: 400, objectFit: "contain", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-0)" }} />
                <button 
                  onClick={removeImage}
                  disabled={uploading}
                  style={{
                    position: "absolute", top: 25, right: -10, background: "#f87171", color: "white",
                    border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                  }}
                  title="Remove Image"
                >✕</button>
              </div>
            ) : (
              <div style={{ width: 200, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)", padding: "1rem" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>No image uploaded yet. Please upload one.</p>
              </div>
            )}
          </div>
        </section>


        {/* Section 2: Daily Text Menu */}
        <section style={{ background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Today&apos;s Menu</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Update the specific food items for any day.
              </p>
            </div>
            <div>
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} 
                style={{ width: "auto", padding: "0.5rem 1rem", fontWeight: 600 }} />
            </div>
          </div>

          {loadingMenu ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>Loading menu for {date}...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", background: "var(--surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <label className="field-label" style={{ fontSize: "0.75rem" }}>Meal Name</label>
                      <input className="field-input" placeholder="e.g. Breakfast, Snacks" value={item.mealName} onChange={e => updateItem(index, "mealName", e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label" style={{ fontSize: "0.75rem" }}>Items</label>
                      <input className="field-input" placeholder="e.g. Aloo Paratha, Dahi" value={item.description} onChange={e => updateItem(index, "description", e.target.value)} />
                    </div>
                  </div>
                  <button onClick={() => removeItem(index)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.2rem", padding: "0.5rem", marginTop: "1.2rem" }}>
                    ✕
                  </button>
                </div>
              ))}

              <button onClick={addMealField} style={{ background: "none", border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", padding: "1rem", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                + Add another meal (e.g. Snacks)
              </button>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: menuMsg.includes("✅") ? "#34d399" : "#f87171" }}>
                  {menuMsg}
                </span>
                <button className="btn-primary" onClick={saveDailyMenu} disabled={savingMenu} style={{ width: "auto", padding: "0.75rem 2rem" }}>
                  {savingMenu ? "Saving..." : "Save Daily Menu"}
                </button>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
