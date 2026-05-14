"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  FiUsers, FiSearch, FiPlus, FiEdit2, 
  FiTrash2, FiUserPlus,
  FiPhone, FiX,
  FiSave
} from "react-icons/fi";
import { toast } from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CustomerRecord {
  _id: string;
  displayName: string;
  phone: string;
  status: "unlinked" | "linked";
  tiffinStatus: "active" | "on_hold";
  notes: string;
  userId: { username: string; displayName: string } | null;
  mealPlan?: {
    planType: "monthly" | "per_tiffin" | "custom";
    rate: number;
    startDate: string;
    endDate?: string;
    meals: string[];
  };
}

interface SearchResult {
  username: string;
  displayName: string;
}

// ─── Badge Component ──────────────────────────────────────────────────────────
function Badge({ label, type = "default" }: { label: string; type?: "default" | "success" | "warning" | "error" | "info" }) {
  const styles: Record<string, any> = {
    default: { color: "var(--t3)", bg: "var(--s2)", border: "var(--bd)" },
    success: { color: "var(--green)", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.15)" },
    warning: { color: "var(--amber)", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.15)" },
    error: { color: "var(--red)", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.15)" },
    info: { color: "var(--brand)", bg: "rgba(255, 107, 53, 0.08)", border: "rgba(255, 107, 53, 0.15)" },
  };
  const s = styles[type];
  return (
    <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ record, onClose, onSaved }: {
  record: CustomerRecord;
  onClose: () => void;
  onSaved: (updated: CustomerRecord) => void;
}) {
  const [displayName, setDisplayName] = useState(record.displayName);
  const [phone, setPhone] = useState(record.phone);
  const [tiffinStatus, setTiffinStatus] = useState(record.tiffinStatus);
  const [notes, setNotes] = useState(record.notes);
  
  const [planType, setPlanType] = useState(record.mealPlan?.planType || "monthly");
  const [rate, setRate] = useState(record.mealPlan?.rate?.toString() || "0");
  const [startDate, setStartDate] = useState(record.mealPlan?.startDate ? new Date(record.mealPlan.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(record.mealPlan?.endDate ? new Date(record.mealPlan.endDate).toISOString().split('T')[0] : "");
  const [mealsStr, setMealsStr] = useState(record.mealPlan?.meals?.join(", ") || "Breakfast, Lunch, Dinner");
  
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/customers/${record._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          displayName, phone, tiffinStatus, notes,
          mealPlan: {
            planType,
            rate: Number(rate),
            startDate: new Date(startDate).toISOString(),
            endDate: endDate ? new Date(endDate).toISOString() : undefined,
            meals: mealsStr.split(",").map(m => m.trim()).filter(m => m.length > 0),
          }
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      onSaved(data.record);
      toast.success("Customer updated.");
      onClose();
    } catch {
      toast.error("Failed to save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-card animate-fade-up" style={{ maxWidth: 500, padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>Edit Customer</h2>
          <button onClick={onClose} style={{ background: "transparent", color: "var(--t3)", fontSize: "1.5rem" }}><FiX /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label className="field-label">Display Name</label>
            <input className="field-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" placeholder="10-digit" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <div>
              <label className="field-label">Status</label>
              <div className="role-toggle">
                <button type="button" className={`role-btn ${tiffinStatus === "active" ? "active" : ""}`} onClick={() => setTiffinStatus("active")}>Active</button>
                <button type="button" className={`role-btn ${tiffinStatus === "on_hold" ? "active" : ""}`} onClick={() => setTiffinStatus("on_hold")}>Hold</button>
              </div>
            </div>
          </div>

          <div style={{ padding: "1.5rem", background: "var(--s2)", borderRadius: "var(--r2)", border: "1px solid var(--bd)" }}>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 900, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.25rem" }}>Meal Plan Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="field-label" style={{ fontSize: "0.65rem" }}>Plan Type</label>
                <select className="field-input" value={planType} onChange={e => setPlanType(e.target.value as any)}>
                  <option value="monthly">Monthly Fixed</option>
                  <option value="per_tiffin">Per Tiffin</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="field-label" style={{ fontSize: "0.65rem" }}>Rate (₹)</label>
                <input className="field-input" type="number" placeholder="Rate ₹" value={rate} onChange={e => setRate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label" style={{ fontSize: "0.65rem" }}>Meals Included</label>
              <input className="field-input" placeholder="Breakfast, Lunch, Dinner" value={mealsStr} onChange={e => setMealsStr(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" style={{ flex: 1.5 }} onClick={save} disabled={loading}>
              {loading ? <span className="spinner" /> : <><FiSave /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add Customer Modal ────────────────────────────────────────────────────────
function AddModal({ onClose, onAdded }: {
  onClose: () => void;
  onAdded: (r: CustomerRecord) => void;
}) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/provider/customers/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  async function addByUsername(username: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/provider/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "username", username }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      onAdded(data.record);
      toast.success("Customer added!");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/provider/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "manual", displayName: manualName, phone: manualPhone }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      onAdded(data.record);
      toast.success("Manual customer created.");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-card animate-fade-up" style={{ maxWidth: 480, padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>Add Customer</h2>
          <button onClick={onClose} style={{ background: "transparent", color: "var(--t3)", fontSize: "1.5rem" }}><FiX /></button>
        </div>

        <div className="role-toggle" style={{ marginBottom: "2rem" }}>
          <button className={`role-btn ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}>Search Users</button>
          <button className={`role-btn ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>Manual Entry</button>
        </div>

        {tab === "search" ? (
          <div>
            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
              <FiSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--t3)" }} />
              <input className="field-input" style={{ paddingLeft: "3rem" }} placeholder="Search by username..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 300, overflowY: "auto", paddingRight: "0.5rem" }}>
              {results.map(r => (
                <div key={r.username} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--s2)", border: "1px solid var(--bd)", borderRadius: "var(--r2)" }}>
                  <div>
                    <p style={{ fontWeight: 800, color: "#fff", fontSize: "0.95rem" }}>{r.displayName}</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--brand)", fontWeight: 700 }}>@{r.username}</p>
                  </div>
                  <button className="btn-primary" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }} onClick={() => addByUsername(r.username)}>Add</button>
                </div>
              ))}
              {loading && <div style={{ textAlign: "center" }}><span className="spinner" /></div>}
            </div>
          </div>
        ) : (
          <form onSubmit={addManual} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="field-label">Customer Name</label>
              <input className="field-input" placeholder="e.g. Rahul Verma" value={manualName} onChange={e => setManualName(e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Phone Number</label>
              <input className="field-input" placeholder="10-digit number" value={manualPhone} onChange={e => setManualPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "1rem", height: "54px" }}>
              {loading ? <span className="spinner" /> : <><FiUserPlus /> Create Customer</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProviderCustomersPage() {
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<CustomerRecord | null>(null);
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked" | "on_hold">("all");

  useEffect(() => {
    fetch("/api/provider/customers")
      .then(r => r.json())
      .then(d => { setRecords(d.records ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = records.filter(r => {
    if (filter === "linked") return r.status === "linked";
    if (filter === "unlinked") return r.status === "unlinked";
    if (filter === "on_hold") return r.tiffinStatus === "on_hold";
    return true;
  });

  async function removeCustomer(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const res = await fetch(`/api/provider/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords(prev => prev.filter(x => x._id !== id));
        toast.success("Customer deleted.");
      }
    } catch {
      toast.error("Failed to delete.");
    }
  }

  return (
    <div className="animate-fade-up">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Customers</h1>
          <p style={{ color: "var(--t2)", fontSize: "1.1rem", fontWeight: 500 }}>Manage your {records.length} tiffin subscribers.</p>
        </div>
        <button className="btn-primary" style={{ padding: "0.8rem 1.75rem" }} onClick={() => setShowAdd(true)}>
          <FiPlus /> Add Customer
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem", background: "var(--s1)", padding: "0.4rem", borderRadius: "var(--r2)", border: "1px solid var(--bd)", width: "fit-content" }}>
        {[
          { id: "all", label: "All" },
          { id: "linked", label: "Connected" },
          { id: "unlinked", label: "Manual" },
          { id: "on_hold", label: "On Hold" },
        ].map(btn => (
          <button 
            key={btn.id} 
            onClick={() => setFilter(btn.id as any)}
            style={{ 
              padding: "0.6rem 1.25rem", borderRadius: "var(--r1)", fontSize: "0.85rem", fontWeight: 800,
              background: filter === btn.id ? "var(--brand)" : "transparent",
              color: filter === btn.id ? "#fff" : "var(--t3)"
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "5rem" }}><span className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "6rem 2rem", borderStyle: "dashed", opacity: 0.8 }}>
          <FiUsers style={{ fontSize: "3.5rem", color: "var(--t4)", marginBottom: "1.5rem" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>No customers found</h3>
          <p style={{ color: "var(--t3)", marginBottom: "2.5rem", fontWeight: 500 }}>Start adding customers to manage their daily tiffins.</p>
          <button className="btn-primary" style={{ margin: "0 auto" }} onClick={() => setShowAdd(true)}>+ Add Your First Customer</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filtered.map(r => (
            <div key={r._id} className="card hover-lift-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", background: "var(--s1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff", marginBottom: "0.25rem" }}>{r.displayName}</h3>
                  {r.userId && <p style={{ fontSize: "0.85rem", color: "var(--brand)", fontWeight: 800 }}>@{r.userId.username}</p>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Badge label={r.status === "linked" ? "Connected" : "Manual"} type={r.status === "linked" ? "info" : "default"} />
                  <Badge label={r.tiffinStatus === "active" ? "Active" : "Hold"} type={r.tiffinStatus === "active" ? "success" : "warning"} />
                </div>
              </div>

              {r.phone && (
                <div style={{ fontSize: "0.9rem", color: "var(--t2)", display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 500 }}>
                  <div style={{ width: 32, height: 32, background: "var(--s2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--bd)" }}>
                    <FiPhone style={{ fontSize: "0.85rem", color: "var(--brand)" }} />
                  </div>
                  {r.phone}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.75rem", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--bd)" }}>
                <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.7rem" }} onClick={() => setEditRecord(r)}>
                  <FiEdit2 /> Edit Plan
                </button>
                <button className="btn-ghost" style={{ fontSize: "0.8rem", padding: "0.7rem", color: "var(--red)", borderColor: "rgba(239, 68, 68, 0.2)" }} onClick={() => removeCustomer(r._id, r.displayName)}>
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={r => setRecords(prev => [r, ...prev])} />}
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} onSaved={updated => setRecords(prev => prev.map(r => r._id === updated._id ? updated : r))} />}
    </div>
  );
}
