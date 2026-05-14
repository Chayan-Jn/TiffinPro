"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  FiUsers, FiSearch, FiPlus, FiEdit2, FiLink, 
  FiTrash2, FiUserCheck, FiUserPlus, FiInfo,
  FiPhone, FiMoreVertical, FiX, FiChevronLeft,
  FiAlertCircle, FiCheckCircle, FiCheck, FiSave
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface CustomerRecord {
  _id: string;
  displayName: string;
  phone: string;
  status: "unlinked" | "linked";
  tiffinStatus: "active" | "on_hold";
  notes: string;
  possibleDuplicateOf: { _id: string; displayName: string } | null;
  userId: { username: string; displayName: string } | null;
  mealPlan?: {
    planType: "monthly" | "per_tiffin" | "custom";
    rate: number;
    startDate: string;
    endDate?: string;
    meals: string[];
    mealsConsumed?: number;
    mealQuota?: number;
  };
  createdAt: string;
}

interface SearchResult {
  username: string;
  displayName: string;
}

// ─── Badge Component ──────────────────────────────────────────────────────────
function Badge({ label, type = "default" }: { label: string; type?: "default" | "success" | "warning" | "error" | "info" }) {
  const styles: Record<string, any> = {
    default: { color: "var(--text-secondary)", bg: "var(--surface-2)", border: "var(--border)" },
    success: { color: "var(--brand-success)", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)" },
    warning: { color: "var(--brand-warning)", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" },
    error: { color: "var(--brand-error)", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" },
    info: { color: "var(--brand-primary)", bg: "rgba(99, 102, 241, 0.1)", border: "rgba(99, 102, 241, 0.2)" },
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
      <div className="card animate-scale-in" style={{ maxWidth: 500, width: "100%", padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Edit Customer</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem" }}><FiX /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label className="field-label">Display Name</label>
            <input className="field-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" placeholder="10-digit" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
            <div>
              <label className="field-label">Tiffin Status</label>
              <div className="role-toggle" style={{ height: "46px" }}>
                <button type="button" className={`role-btn ${tiffinStatus === "active" ? "active" : ""}`} onClick={() => setTiffinStatus("active")}>Active</button>
                <button type="button" className={`role-btn ${tiffinStatus === "on_hold" ? "active" : ""}`} onClick={() => setTiffinStatus("on_hold")}>Hold</button>
              </div>
            </div>
          </div>

          <div style={{ padding: "1.5rem", background: "var(--surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "1rem" }}>Meal Plan Settings</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="field-label" style={{ fontSize: "0.7rem" }}>Plan Type</label>
                <select className="field-input" value={planType} onChange={e => setPlanType(e.target.value as any)}>
                  <option value="monthly">Monthly Fixed</option>
                  <option value="per_tiffin">Per Tiffin</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="field-label" style={{ fontSize: "0.7rem" }}>Rate (₹)</label>
                <input className="field-input" type="number" placeholder="Rate ₹" value={rate} onChange={e => setRate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="field-label" style={{ fontSize: "0.7rem" }}>Meals</label>
              <input className="field-input" placeholder="Breakfast, Lunch, Dinner" value={mealsStr} onChange={e => setMealsStr(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button className="btn-primary" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#fff" }} onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={loading}>
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
      <div className="card animate-scale-in" style={{ maxWidth: 480, width: "100%", padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff" }}>Add Customer</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem" }}><FiX /></button>
        </div>

        <div className="role-toggle" style={{ marginBottom: "2rem" }}>
          <button className={`role-btn ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}>Search Users</button>
          <button className={`role-btn ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>Manual Entry</button>
        </div>

        {tab === "search" ? (
          <div>
            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
              <FiSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input className="field-input" style={{ paddingLeft: "3rem" }} placeholder="Search by username..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 300, overflowY: "auto" }}>
              {results.map(r => (
                <div key={r.username} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <div>
                    <p style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>{r.displayName}</p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>@{r.username}</p>
                  </div>
                  <button className="btn-primary" style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.8rem" }} onClick={() => addByUsername(r.username)}>Add</button>
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
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "1rem" }}>
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
    <div style={{ minHeight: "100%" }} className="animate-fade-in">
      {/* Header Area */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>Customers</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Manage your {records.length} tiffin subscribers.</p>
        </div>
        <button className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.5rem" }} onClick={() => setShowAdd(true)}>
          <FiPlus /> Add Customer
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2.5rem", background: "var(--surface-1)", padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", width: "fit-content" }}>
        {[
          { id: "all", label: "All Customers" },
          { id: "linked", label: "Connected" },
          { id: "unlinked", label: "Manual Only" },
          { id: "on_hold", label: "On Hold" },
        ].map(btn => (
          <button 
            key={btn.id} 
            onClick={() => setFilter(btn.id as any)}
            style={{ 
              padding: "0.6rem 1.25rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: 700,
              border: "none", background: filter === btn.id ? "var(--brand-primary)" : "transparent",
              color: filter === btn.id ? "#fff" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s"
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
        <div className="card" style={{ textAlign: "center", padding: "5rem 2rem", borderStyle: "dashed" }}>
          <FiUsers style={{ fontSize: "3.5rem", color: "var(--text-muted)", marginBottom: "1.5rem", opacity: 0.5 }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: "0.5rem" }}>No customers found</h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem" }}>Start adding customers to manage their daily tiffins and billing.</p>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowAdd(true)}>+ Add Your First Customer</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {filtered.map(r => (
            <div key={r._id} className="card animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: "0.25rem" }}>{r.displayName}</h3>
                  {r.userId && <p style={{ fontSize: "0.85rem", color: "var(--brand-primary)", fontWeight: 700 }}>@{r.userId.username}</p>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Badge label={r.status === "linked" ? "Connected" : "Manual"} type={r.status === "linked" ? "info" : "default"} />
                  <Badge label={r.tiffinStatus === "active" ? "Active" : "Hold"} type={r.tiffinStatus === "active" ? "success" : "warning"} />
                </div>
              </div>

              {r.phone && (
                <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{ width: 32, height: 32, background: "var(--surface-2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FiPhone style={{ fontSize: "0.9rem", color: "var(--text-muted)" }} />
                  </div>
                  {r.phone}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "auto", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
                <button className="btn-primary" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.85rem" }} onClick={() => setEditRecord(r)}>
                  <FiEdit2 /> Edit Plan
                </button>
                <button className="btn-primary" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--brand-error)", fontSize: "0.85rem" }} onClick={() => removeCustomer(r._id, r.displayName)}>
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
