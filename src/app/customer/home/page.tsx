"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";

interface MealPlan {
  planType: string;
  rate: number;
  startDate: string;
  endDate?: string;
  meals: string[];
}

interface ProviderRecord {
  _id: string;
  providerId: { _id: string; username: string; displayName: string };
  tiffinStatus: "active" | "on_hold";
  mealPlan?: MealPlan;
  createdAt: string;
}

interface SearchResult {
  username: string;
  displayName: string;
}

interface DailyMenuItem {
  mealName: string;
  description: string;
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase" as const, color, background: bg,
      border: `1px solid ${color}40`, borderRadius: 5, padding: "2px 7px",
    }}>{label}</span>
  );
}

// ─── Find Provider Modal ───
function FindProviderModal({ onClose, onAdded, username }: {
  onClose: () => void;
  onAdded: (r: ProviderRecord) => void;
  username: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [warning, setWarning] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/customer/providers/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  async function subscribe(providerUsername: string) {
    setAddingUsername(providerUsername); setSuccessMsg(""); setWarning("");
    const res = await fetch("/api/customer/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: providerUsername }),
    });
    const data = await res.json();
    setAddingUsername(null);
    if (!res.ok) { setWarning(data.error); return; }
    setSuccessMsg(`✅ Subscribed to ${data.record.providerId?.displayName ?? providerUsername}.`);
    if (data.warning) setWarning(data.warning);
    setResults(prev => prev.filter(r => r.username !== providerUsername));
    onAdded(data.record);
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>Find a Provider</h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Search for your tiffin provider by their username or business name.
        </p>
        <input className="field-input" placeholder="Type provider name…" value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus style={{ marginBottom: "0.75rem" }} />
        {successMsg && <div style={{ color: "#34d399", fontSize: "0.85rem", marginBottom: "0.5rem" }}>{successMsg}</div>}
        {warning && (
          <div className="error-alert" style={{ marginBottom: "0.75rem", borderColor: "rgba(245,158,11,0.4)", color: "#fcd34d", background: "rgba(245,158,11,0.08)" }}>
            ⚠️ {warning}
          </div>
        )}
        {searching && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Searching…</p>}
        {!searching && results.length === 0 && query.length > 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No providers found.</p>
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
              <button className="btn-primary"
                style={{ width: "auto", padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
                disabled={addingUsername === r.username}
                onClick={() => subscribe(r.username)}>
                {addingUsername === r.username ? "Subscribing…" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Provider Details Modal (Menu + Plan) ───
function ProviderDetailsModal({ record, initialTab, onClose }: { record: ProviderRecord, initialTab: "today" | "full", onClose: () => void }) {
  const [tab, setTab] = useState<"today" | "full">(initialTab);
  const [menuImg, setMenuImg] = useState("");
  const [dailyMenu, setDailyMenu] = useState<DailyMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if overdue
  const today = new Date();
  today.setHours(0,0,0,0);
  const isOverdue = record.mealPlan?.endDate ? new Date(record.mealPlan.endDate) < today : false;

  useEffect(() => {
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    fetch(`/api/customer/menu/${record.providerId._id}?date=${todayStr}`)
      .then(r => r.json())
      .then(d => {
        setMenuImg(d.menuImageUrl || "");
        setDailyMenu(d.dailyMenu || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: 600, padding: 0, display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
              {record.providerId.displayName}
            </h2>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>@{record.providerId.username}</div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
          <button onClick={() => setTab("today")} style={{ flex: 1, padding: "0.8rem", border: "none", background: tab === "today" ? "var(--surface-2)" : "transparent", borderBottom: tab === "today" ? "2px solid var(--brand-orange)" : "none", color: tab === "today" ? "var(--brand-orange)" : "var(--text-secondary)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
            🍽️ Today's Menu
          </button>
          <button onClick={() => setTab("full")} style={{ flex: 1, padding: "0.8rem", border: "none", background: tab === "full" ? "var(--surface-2)" : "transparent", borderBottom: tab === "full" ? "2px solid var(--brand-orange)" : "none", color: tab === "full" ? "var(--text-primary)" : "var(--text-secondary)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
            📖 Full Menu
          </button>
        </div>

        <div style={{ padding: "2rem", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Plan Overdue Warning */}
          {isOverdue && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "var(--radius-md)", padding: "1rem", color: "#f87171", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ fontSize: "1.2rem" }}>⚠️</span>
              <div>
                <strong style={{ display: "block", marginBottom: "0.2rem" }}>Meal Plan Overdue</strong>
                <span style={{ fontSize: "0.85rem" }}>Your plan with this provider ended on {new Date(record.mealPlan!.endDate!).toLocaleDateString()}. Please contact them to extend your plan.</span>
              </div>
            </div>
          )}

          {tab === "today" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>
                What's for today?
              </h3>
              {loading ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading menu...</p>
              ) : dailyMenu.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", background: "var(--surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>Provider hasn&apos;t added today&apos;s menu yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  {dailyMenu.map((m, i) => (
                    <div key={i} style={{ background: "var(--surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>{m.mealName}</div>
                      <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{m.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "full" && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)" }}>Full Provider Menu</h3>
              {loading ? (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Loading...</p>
              ) : menuImg ? (
                <img src={menuImg} alt="Mess Menu" style={{ width: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface-0)" }} />
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic", background: "var(--surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>Provider hasn&apos;t uploaded a photo menu.</p>
              )}
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}


// ─── Main ───
export default function CustomerHome() {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFind, setShowFind] = useState(false);
  const [viewProvider, setViewProvider] = useState<{ record: ProviderRecord, tab: "today" | "full" } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => {
      setUsername((s?.user as { username?: string })?.username ?? "");
    });
    fetch("/api/customer/providers").then(r => r.json()).then(d => {
      setProviders(d.records ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function removeProvider(id: string) {
    setRemoving(true);
    await fetch(`/api/customer/providers/${id}`, { method: "DELETE" });
    setProviders(prev => prev.filter(p => p._id !== id));
    setConfirmRemove(null);
    setRemoving(false);
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div style={{ minHeight: "100dvh", background: "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(251,191,36,0.06) 0%, transparent 60%), var(--surface-0)" }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
        background: "var(--surface-1)", position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🍱</span>
          <span style={{
            fontWeight: 800, fontSize: "1.1rem",
            background: "linear-gradient(135deg, #fff, var(--brand-amber))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>TiffinPro</span>
          <span style={{
            marginLeft: "0.5rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--brand-amber)", background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "2px 8px", textTransform: "uppercase",
          }}>Customer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>@{username}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              background: "var(--surface-2)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", borderRadius: 8, padding: "0.4rem 0.9rem",
              fontSize: "0.8rem", cursor: "pointer", fontWeight: 600,
            }}>Sign Out</button>
        </div>
      </nav>

      <main style={{ padding: "2.5rem 2rem", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
              My Providers
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Your subscribed tiffin providers
            </p>
          </div>
          <button className="btn-primary"
            style={{ width: "auto", padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}
            onClick={() => setShowFind(true)}>
            + Find Provider
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>Loading…</p>
        ) : providers.length === 0 ? (
          <div style={{
            background: "var(--surface-1)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)", padding: "3rem", textAlign: "center", color: "var(--text-muted)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🍽️</div>
            <p style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>No providers yet.</p>
            <p style={{ fontSize: "0.85rem" }}>Click &quot;+ Find Provider&quot; to subscribe to a tiffin provider.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {providers.map(p => {
              const isOverdue = p.mealPlan?.endDate ? new Date(p.mealPlan.endDate) < today : false;
              
              return (
              <div key={p._id} style={{
                background: "var(--surface-1)", border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.5)' : 'var(--border)'}`,
                borderRadius: "var(--radius-lg)", padding: "1.5rem",
                display: "flex", flexDirection: "column", gap: "1.5rem", transition: "all 0.2s",
                boxShadow: isOverdue ? "0 4px 12px rgba(248,113,113,0.05)" : "none"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                      {p.providerId?.displayName ?? "Provider"}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.6rem" }}>
                      @{p.providerId?.username}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      {p.tiffinStatus === "active"
                        ? <Badge label="Active" color="var(--brand-orange)" bg="rgba(249,115,22,0.1)" />
                        : <Badge label="On Hold" color="#9ca3af" bg="rgba(156,163,175,0.1)" />}
                      {isOverdue && <Badge label="Overdue" color="#f87171" bg="rgba(248,113,113,0.1)" />}
                    </div>
                  </div>
                  <div>
                    {confirmRemove === p._id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "0.75rem", color: "#f87171" }}>Remove?</span>
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button onClick={(e) => { e.stopPropagation(); removeProvider(p._id); }} disabled={removing}
                            style={{ ...actionBtnStyle, color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}>
                            {removing ? "…" : "Yes"}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setConfirmRemove(null); }} style={actionBtnStyle}>No</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmRemove(p._id); }} style={{...actionBtnStyle, border: "none", color: "var(--text-muted)" }}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {p.mealPlan && (
                  <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span>Plan:</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.mealPlan.planType.replace("_", " ")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                      <span>Rate:</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>₹{p.mealPlan.rate}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Meals:</span>
                      <span style={{ fontWeight: 600 }}>{p.mealPlan.meals.join(", ")}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn-primary" onClick={() => setViewProvider({ record: p, tab: "today" })} style={{ flex: 1, padding: "0.75rem", background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)", fontSize: "0.85rem", cursor: "pointer" }}>
                    🍽️ Today's Menu
                  </button>
                  <button className="btn-primary" onClick={() => setViewProvider({ record: p, tab: "full" })} style={{ flex: 1, padding: "0.75rem", background: "var(--surface-2)", color: "var(--text-primary)", border: "1px solid var(--border)", fontSize: "0.85rem", cursor: "pointer" }}>
                    📖 Full Menu
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </main>

      {showFind && (
        <FindProviderModal
          onClose={() => setShowFind(false)}
          username={username}
          onAdded={r => setProviders(prev => [r, ...prev])}
        />
      )}

      {viewProvider && (
        <ProviderDetailsModal 
          record={viewProvider.record} 
          initialTab={viewProvider.tab}
          onClose={() => setViewProvider(null)} 
        />
      )}
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 50, padding: "1rem",
};
const modalStyle: React.CSSProperties = {
  background: "var(--surface-1)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)", padding: "2rem", width: "100%", maxWidth: 480,
  maxHeight: "90dvh", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none",
  animation: "fadeUp 0.25s ease both",
};
const modalHeaderStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem",
};
const modalTitleStyle: React.CSSProperties = { fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" };
const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer", padding: "0.25rem",
};
const actionBtnStyle: React.CSSProperties = {
  background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "0.4rem 0.85rem", fontSize: "0.8rem", fontWeight: 600,
  color: "var(--text-secondary)", cursor: "pointer",
};
