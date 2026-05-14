"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

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
  };
  createdAt: string;
}

interface SearchResult {
  username: string;
  displayName: string;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase" as const, color, background: bg,
      border: `1px solid ${color}40`, borderRadius: 5, padding: "2px 7px",
    }}>{label}</span>
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
  
  // Meal Plan State
  const [planType, setPlanType] = useState(record.mealPlan?.planType || "monthly");
  const [rate, setRate] = useState(record.mealPlan?.rate?.toString() || "0");
  const [startDate, setStartDate] = useState(record.mealPlan?.startDate ? new Date(record.mealPlan.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(record.mealPlan?.endDate ? new Date(record.mealPlan.endDate).toISOString().split('T')[0] : "");
  const [mealsStr, setMealsStr] = useState(record.mealPlan?.meals?.join(", ") || "Breakfast, Lunch, Dinner");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true); setError("");
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
          meals: mealsStr.split(",").map(m => m.trim()).filter(m => m.length > 0)
        }
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onSaved(data.record);
    onClose();
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Edit Customer</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        {error && <div className="error-alert" style={{ marginBottom: "1rem" }}>{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Name</label>
            <input className="field-input" value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input className="field-input" placeholder="Optional" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="field-label">Tiffin Status</label>
            <div className="role-toggle">
              <button type="button" className={`role-btn ${tiffinStatus === "active" ? "active" : ""}`} onClick={() => setTiffinStatus("active")}>✅ Active</button>
              <button type="button" className={`role-btn ${tiffinStatus === "on_hold" ? "active" : ""}`} onClick={() => setTiffinStatus("on_hold")}>⏸️ On Hold</button>
            </div>
          </div>
          <div>
            <label className="field-label">Notes</label>
            <textarea className="field-input" rows={3} style={{ resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ padding: "1rem", background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: "var(--radius-md)" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "1rem", color: "var(--brand-orange)" }}>Meal Plan Details</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="field-label" style={{ fontSize: "0.75rem" }}>Plan Type</label>
                <select className="field-input" value={planType} onChange={e => setPlanType(e.target.value as any)} style={{ padding: "0.6rem" }}>
                  <option value="monthly">Monthly Fixed</option>
                  <option value="per_tiffin">Per Tiffin</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="field-label" style={{ fontSize: "0.75rem" }}>Rate (₹)</label>
                <input type="number" className="field-input" value={rate} onChange={e => setRate(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="field-label" style={{ fontSize: "0.75rem" }}>Start Date</label>
                <input type="date" className="field-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="field-label" style={{ fontSize: "0.75rem" }}>End Date (Optional)</label>
                <input type="date" className="field-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="field-label" style={{ fontSize: "0.75rem" }}>Meals Included</label>
              <input className="field-input" placeholder="e.g. Breakfast, Lunch" value={mealsStr} onChange={e => setMealsStr(e.target.value)} />
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>Comma separated meals they receive</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={save} disabled={loading}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Link Modal ────────────────────────────────────────────────────────────────
function LinkModal({ record, onClose, onLinked }: {
  record: CustomerRecord;
  onClose: () => void;
  onLinked: (updated: CustomerRecord) => void;
}) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function link() {
    setLoading(true); setError("");
    const res = await fetch(`/api/provider/customers/${record._id}/link`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    onLinked(data.record);
    onClose();
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Link to Account</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Enter the username of the registered customer to link to <strong>{record.displayName}</strong>.
        </p>
        {error && <div className="error-alert" style={{ marginBottom: "1rem" }}>{error}</div>}
        <input className="field-input" placeholder="customer_username" value={username}
          onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
          style={{ marginBottom: "1rem" }} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={link} disabled={loading || !username}>
            {loading ? "Linking…" : "Link Account"}
          </button>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
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
  // Search tab
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [warning, setWarning] = useState("");
  // Manual tab
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualSuccess, setManualSuccess] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/provider/customers/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  async function addByUsername(username: string) {
    setAddingUsername(username); setSuccessMsg(""); setWarning("");
    const res = await fetch("/api/provider/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "username", username }),
    });
    const data = await res.json();
    setAddingUsername(null);
    if (!res.ok) { setWarning(data.error); return; }
    setSuccessMsg(`✅ ${data.record.displayName} added successfully.`);
    if (data.warning) setWarning(data.warning);
    setResults(prev => prev.filter(r => r.username !== username));
    onAdded(data.record);
  }

  async function addManual(e: React.FormEvent) {
    e.preventDefault();
    setManualLoading(true); setManualError(""); setManualSuccess("");
    const res = await fetch("/api/provider/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "manual", displayName: manualName, phone: manualPhone }),
    });
    const data = await res.json();
    setManualLoading(false);
    if (!res.ok) { setManualError(data.error); return; }
    setManualSuccess(`✅ ${data.record.displayName} added.${data.warning ? " ⚠️ " + data.warning : ""}`);
    setManualName(""); setManualPhone("");
    onAdded(data.record);
  }

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, maxWidth: 480 }}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Add Customer</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {/* Tabs */}
        <div className="role-toggle" style={{ marginBottom: "1.5rem" }}>
          <button type="button" className={`role-btn ${tab === "search" ? "active" : ""}`} onClick={() => setTab("search")}>🔍 Search</button>
          <button type="button" className={`role-btn ${tab === "manual" ? "active" : ""}`} onClick={() => setTab("manual")}>✏️ Manual</button>
        </div>

        {tab === "search" && (
          <div>
            <input id="add-search-input" className="field-input" placeholder="Type username…" value={query}
              onChange={e => setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              autoFocus style={{ marginBottom: "0.75rem" }} />
            {successMsg && <div style={{ color: "#34d399", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{successMsg}</div>}
            {warning && <div className="error-alert" style={{ marginBottom: "0.5rem", borderColor: "rgba(245,158,11,0.4)", color: "#fcd34d", background: "rgba(245,158,11,0.08)" }}>{warning}</div>}
            {searching && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Searching…</p>}
            {!searching && results.length === 0 && query.length > 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No customers found.</p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {results.map(r => (
                <div key={r.username} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "var(--surface-2)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "0.75rem 1rem",
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{r.displayName}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>@{r.username}</div>
                  </div>
                  <button className="btn-primary" style={{ width: "auto", padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
                    disabled={addingUsername === r.username}
                    onClick={() => addByUsername(r.username)}>
                    {addingUsername === r.username ? "Adding…" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "manual" && (
          <form onSubmit={addManual} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {manualSuccess && <div style={{ color: "#34d399", fontSize: "0.85rem" }}>{manualSuccess}</div>}
            {manualError && <div className="error-alert">{manualError}</div>}
            <div>
              <label className="field-label">Customer Name *</label>
              <input id="manual-name" className="field-input" placeholder="e.g. Ramesh Gupta" value={manualName}
                onChange={e => setManualName(e.target.value)} required autoFocus={tab === "manual"} />
            </div>
            <div>
              <label className="field-label">Phone (optional)</label>
              <input id="manual-phone" className="field-input" placeholder="9876543210" value={manualPhone}
                onChange={e => setManualPhone(e.target.value)} maxLength={15} />
            </div>
            <button id="manual-add-submit" type="submit" className="btn-primary" disabled={manualLoading}>
              {manualLoading ? "Adding…" : "Add Customer"}
            </button>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
              You can link this to a TiffinPro account later.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Customer Card ─────────────────────────────────────────────────────────────
function CustomerCard({ record, onEdit, onDelete, onLink }: {
  record: CustomerRecord;
  onEdit: () => void;
  onDelete: () => void;
  onLink: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmAndDelete() {
    setDeleting(true);
    await fetch(`/api/provider/customers/${record._id}`, { method: "DELETE" });
    setDeleting(false);
    onDelete();
  }

  return (
    <div style={{
      background: "var(--surface-1)", border: `1px solid ${record.possibleDuplicateOf ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
      borderRadius: "var(--radius-md)", padding: "1.25rem",
    }}>
      {/* Duplicate warning */}
      {record.possibleDuplicateOf && (
        <div style={{
          background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 6, padding: "0.5rem 0.75rem", marginBottom: "0.75rem",
          fontSize: "0.8rem", color: "#fcd34d",
        }}>
          ⚠️ A customer just connected with a similar name — possible duplicate. Delete this record if it&apos;s the same person.
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem", color: "var(--text-primary)" }}>
            {record.displayName}
          </div>
          {record.userId && (
            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.3rem" }}>
              @{record.userId.username}
            </div>
          )}
          {record.phone && (
            <div style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
              📞 {record.phone}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
            {record.status === "linked"
              ? <Badge label="Connected" color="#34d399" bg="rgba(52,211,153,0.1)" />
              : <Badge label="Manual" color="#f59e0b" bg="rgba(245,158,11,0.1)" />}
            {record.tiffinStatus === "active"
              ? <Badge label="Active" color="var(--brand-orange)" bg="rgba(249,115,22,0.1)" />
              : <Badge label="On Hold" color="#9ca3af" bg="rgba(156,163,175,0.1)" />}
          </div>
          {record.notes && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.5rem", fontStyle: "italic" }}>
              {record.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.4rem", flexShrink: 0 }}>
          <button onClick={onEdit} style={actionBtnStyle}>✏️ Edit</button>
          {record.status === "unlinked" && (
            <button onClick={onLink} style={actionBtnStyle}>🔗 Link</button>
          )}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ ...actionBtnStyle, color: "#f87171" }}>🗑️ Delete</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.3rem" }}>
              <span style={{ fontSize: "0.7rem", color: "#f87171", fontWeight: 600 }}>Sure?</span>
              <button onClick={confirmAndDelete} disabled={deleting}
                style={{ ...actionBtnStyle, color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}>
                {deleting ? "…" : "Yes"}
              </button>
              <button onClick={() => setConfirmDelete(false)} style={actionBtnStyle}>No</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProviderCustomersPage() {
  const router = useRouter();
  const [records, setRecords] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editRecord, setEditRecord] = useState<CustomerRecord | null>(null);
  const [linkRecord, setLinkRecord] = useState<CustomerRecord | null>(null);
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

  const filterBtns: { key: typeof filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "linked", label: "Connected" },
    { key: "unlinked", label: "Manual" },
    { key: "on_hold", label: "On Hold" },
  ];

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
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Customers</span>
          <span style={{
            fontSize: "0.75rem", fontWeight: 700, background: "var(--surface-2)",
            border: "1px solid var(--border)", borderRadius: 20, padding: "2px 10px",
            color: "var(--text-secondary)",
          }}>{records.length}</span>
        </div>
        <button id="open-add-modal" className="btn-primary"
          style={{ width: "auto", padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
          onClick={() => setShowAdd(true)}>
          + Add Customer
        </button>
      </nav>

      <main style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" as const }}>
          {filterBtns.map(btn => (
            <button key={btn.key} onClick={() => setFilter(btn.key)}
              style={{
                padding: "0.4rem 1rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 600,
                border: "1px solid", cursor: "pointer",
                background: filter === btn.key ? "var(--brand-orange)" : "var(--surface-2)",
                borderColor: filter === btn.key ? "var(--brand-orange)" : "var(--border)",
                color: filter === btn.key ? "#fff" : "var(--text-secondary)",
              }}>
              {btn.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
            <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No customers yet.</p>
            <p style={{ fontSize: "0.85rem" }}>Click &quot;+ Add Customer&quot; to get started.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
            {filtered.map(r => (
              <CustomerCard key={r._id} record={r}
                onEdit={() => setEditRecord(r)}
                onDelete={() => setRecords(prev => prev.filter(x => x._id !== r._id))}
                onLink={() => setLinkRecord(r)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onAdded={r => setRecords(prev => [r, ...prev])}
        />
      )}
      {editRecord && (
        <EditModal record={editRecord} onClose={() => setEditRecord(null)}
          onSaved={updated => setRecords(prev => prev.map(r => r._id === updated._id ? updated : r))}
        />
      )}
      {linkRecord && (
        <LinkModal record={linkRecord} onClose={() => setLinkRecord(null)}
          onLinked={updated => setRecords(prev => prev.map(r => r._id === updated._id ? updated : r))}
        />
      )}
    </div>
  );
}

// ─── Shared styles ─────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 50, padding: "1rem",
};
const modalStyle: React.CSSProperties = {
  background: "var(--surface-1)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)", padding: "2rem", width: "100%",
  maxHeight: "90dvh", overflowY: "auto",
  animation: "fadeUp 0.25s ease both",
};
const modalHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem",
};
const modalTitleStyle: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" };
const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem",
  cursor: "pointer", lineHeight: 1, padding: "0.25rem",
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: "0.8rem", background: "var(--surface-2)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", fontWeight: 600,
  cursor: "pointer", fontSize: "0.875rem",
};
const actionBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "0.35rem 0.75rem", fontSize: "0.78rem", fontWeight: 600,
  color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" as const,
};
