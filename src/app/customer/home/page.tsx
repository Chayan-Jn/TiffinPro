"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { 
  FiSearch, FiActivity, FiLogOut, FiCreditCard, 
  FiUser, FiPlus, FiX, FiCheck, FiChevronRight, 
  FiCalendar, FiInfo, FiTrash2, FiAlertCircle 
} from "react-icons/fi";
import { toast } from "react-hot-toast";

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
  mealPlan?: {
    planType: string;
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

interface DailyMenuItem {
  mealName: string;
  description: string;
}

function Badge({ label, type = "default" }: { label: string; type?: "default" | "success" | "warning" | "error" }) {
  const styles: Record<string, any> = {
    default: { color: "var(--text-secondary)", bg: "var(--surface-2)", border: "var(--border)" },
    success: { color: "var(--brand-success)", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.2)" },
    warning: { color: "var(--brand-warning)", bg: "rgba(245, 158, 11, 0.1)", border: "rgba(245, 158, 11, 0.2)" },
    error: { color: "var(--brand-error)", bg: "rgba(239, 68, 68, 0.1)", border: "rgba(239, 68, 68, 0.2)" },
  };
  const s = styles[type];
  return (
    <span className="badge" style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  );
}

// ─── Find Provider Modal ───
function FindProviderModal({ onClose, onAdded }: {
  onClose: () => void;
  onAdded: (r: ProviderRecord) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/customer/providers/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      toast.error("Search failed.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
  }, [query, search]);

  async function subscribe(providerUsername: string) {
    setAddingUsername(providerUsername);
    try {
      const res = await fetch("/api/customer/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: providerUsername }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      
      toast.success(`Subscribed to ${data.record.providerId?.displayName ?? providerUsername}`);
      if (data.warning) toast(data.warning, { icon: "⚠️" });
      
      setResults(prev => prev.filter(r => r.username !== providerUsername));
      onAdded(data.record);
    } catch {
      toast.error("Subscription failed.");
    } finally {
      setAddingUsername(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card animate-scale-in" style={{ maxWidth: 480, width: "100%", padding: "2.5rem" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>Find Provider</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem" }}><FiX /></button>
        </div>
        
        <div style={{ position: "relative", marginBottom: "1.5rem" }}>
          <FiSearch style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="field-input" style={{ paddingLeft: "3rem" }} placeholder="Provider name or username..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
        </div>

        {searching && <div style={{ textAlign: "center", padding: "1rem" }}><span className="spinner" /></div>}
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: 300, overflowY: "auto" }}>
          {results.map(r => (
            <div key={r.username} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", padding: "1rem", border: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{r.displayName}</div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>@{r.username}</div>
              </div>
              <button className="btn-primary" style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem" }} disabled={addingUsername === r.username} onClick={() => subscribe(r.username)}>
                {addingUsername === r.username ? "..." : <><FiPlus /> Subscribe</>}
              </button>
            </div>
          ))}
          {!searching && results.length === 0 && query.trim() !== "" && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>No providers found.</p>
          )}
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

  const today = new Date();
  today.setHours(0,0,0,0);
  const isOverdue = record.mealPlan?.endDate ? new Date(record.mealPlan.endDate) < today : false;

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    fetch(`/api/customer/menu/${record.providerId._id}?date=${todayStr}`)
      .then(r => r.json())
      .then(d => {
        setMenuImg(d.menuImageUrl || "");
        setDailyMenu(d.dailyMenu || []);
      })
      .finally(() => setLoading(false));
  }, [record.providerId._id]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card animate-scale-in" style={{ maxWidth: 600, width: "100%", padding: 0, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>{record.providerId.displayName}</h2>
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>@{record.providerId.username}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem" }}><FiX /></button>
        </div>

        <div style={{ display: "flex", background: "var(--surface-2)" }}>
          <button onClick={() => setTab("today")} style={{ flex: 1, padding: "1rem", border: "none", background: tab === "today" ? "transparent" : "rgba(0,0,0,0.2)", color: tab === "today" ? "var(--brand-primary)" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", borderBottom: tab === "today" ? "2px solid var(--brand-primary)" : "none" }}>
            🍽️ Today
          </button>
          <button onClick={() => setTab("full")} style={{ flex: 1, padding: "1rem", border: "none", background: tab === "full" ? "transparent" : "rgba(0,0,0,0.2)", color: tab === "full" ? "var(--brand-primary)" : "var(--text-muted)", fontWeight: 700, cursor: "pointer", borderBottom: tab === "full" ? "2px solid var(--brand-primary)" : "none" }}>
            📖 Menu Card
          </button>
        </div>

        <div style={{ padding: "2rem", maxHeight: "70vh", overflowY: "auto" }}>
          {isOverdue && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", padding: "1rem", color: "var(--brand-error)", display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <FiAlertCircle style={{ flexShrink: 0, marginTop: "0.1rem" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>Plan Expired</div>
                <div style={{ fontSize: "0.8rem" }}>Your meal plan ended on {new Date(record.mealPlan!.endDate!).toLocaleDateString()}. Contact provider to renew.</div>
              </div>
            </div>
          )}

          {tab === "today" ? (
            <div>
              {loading ? <div style={{ textAlign: "center" }}><span className="spinner" /></div> : dailyMenu.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>No menu updated for today.</div>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {dailyMenu.map((m, i) => (
                    <div key={i} style={{ background: "var(--surface-2)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--brand-primary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>{m.mealName}</div>
                      <div style={{ color: "#fff", fontWeight: 600 }}>{m.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              {loading ? <span className="spinner" /> : menuImg ? (
                <img src={menuImg} alt="Menu" style={{ maxWidth: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }} />
              ) : (
                <div style={{ color: "var(--text-muted)", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)" }}>No menu card uploaded.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Adjust Meals Component ───
function AdjustMealsCard({ record }: { record: ProviderRecord }) {
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [updatingAdj, setUpdatingAdj] = useState<string | null>(null);

  useEffect(() => {
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    fetch(`/api/customer/adjustments?date=${todayStr}`)
      .then(r => r.json())
      .then(d => {
        if (d.logs) {
          const adj: Record<string, number> = {};
          d.logs.forEach((log: any) => {
            if (log.providerId === record.providerId._id) adj[log.mealName] = log.quantity;
          });
          setAdjustments(adj);
        }
      });
  }, [record.providerId._id]);

  async function handleAdjust(mealName: string, newQuantity: number) {
    if (newQuantity < 0) return;
    setUpdatingAdj(mealName);
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    try {
      const res = await fetch("/api/customer/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: record.providerId._id, date: todayStr, mealName, quantity: newQuantity })
      });
      if (!res.ok) throw new Error("Failed to update");
      setAdjustments(prev => ({ ...prev, [mealName]: newQuantity }));
      toast.success(`${mealName} updated to ${newQuantity}`);
    } catch {
      toast.error("Update failed.");
    } finally {
      setUpdatingAdj(null);
    }
  }

  return (
    <div style={{ background: "var(--surface-0)", borderRadius: "var(--radius-md)", padding: "1.25rem", border: "1px solid var(--border)" }}>
      <h4 style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <FiCalendar /> Today&apos;s Tiffins
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {record.mealPlan!.meals.map(mealName => {
          const qty = adjustments[mealName] !== undefined ? adjustments[mealName] : 1;
          return (
            <div key={mealName} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: qty === 0 ? "var(--brand-error)" : "var(--text-secondary)" }}>
                {mealName} {qty === 0 && <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>(Skipped)</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "var(--surface-2)", padding: "0.25rem", borderRadius: 8 }}>
                <button onClick={() => handleAdjust(mealName, qty - 1)} disabled={qty === 0 || updatingAdj === mealName} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "var(--surface-3)", color: "#fff", cursor: "pointer" }}>-</button>
                <span style={{ fontWeight: 800, width: 20, textAlign: "center", color: "#fff" }}>{updatingAdj === mealName ? "..." : qty}</span>
                <button onClick={() => handleAdjust(mealName, qty + 1)} disabled={updatingAdj === mealName} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "var(--surface-3)", color: "#fff", cursor: "pointer" }}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CustomerHome() {
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFind, setShowFind] = useState(false);
  const [viewProvider, setViewProvider] = useState<{ record: ProviderRecord, tab: "today" | "full" } | null>(null);
  const [username, setUsername] = useState("");
  const [pendingBills, setPendingBills] = useState(0);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => setUsername(s?.user?.username ?? ""));
    fetch("/api/customer/providers").then(r => r.json()).then(d => setProviders(d.records ?? [])).finally(() => setLoading(false));
    fetch("/api/customer/billing").then(r => r.json()).then(d => {
      if (d.invoices) setPendingBills(d.invoices.filter((i: any) => i.status === "pending").length);
    });
  }, []);

  async function removeProvider(id: string) {
    if (!confirm("Remove this provider?")) return;
    try {
      const res = await fetch(`/api/customer/providers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProviders(prev => prev.filter(p => p._id !== id));
        toast.success("Provider removed.");
      }
    } catch {
      toast.error("Failed to remove.");
    }
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--surface-0)" }}>
      {/* Navbar */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 2rem", borderBottom: "1px solid var(--border)", background: "rgba(9, 9, 11, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 32, height: 32, background: "var(--brand-primary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}><FiActivity style={{ color: "#fff" }} /></div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em" }}>TiffinPro</span>
          <span style={{ marginLeft: "0.5rem", fontSize: "0.6rem", fontWeight: 800, color: "var(--brand-primary)", background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>Customer</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/customer/billing" style={{ color: pendingBills > 0 ? "var(--brand-error)" : "var(--text-secondary)", position: "relative", fontSize: "1.25rem" }}>
            <FiCreditCard />
            {pendingBills > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "var(--brand-error)", color: "#fff", fontSize: "0.6rem", fontWeight: 900, width: 14, height: 14, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{pendingBills}</span>}
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: 32, height: 32, background: "var(--surface-2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 }}>{username[0]?.toUpperCase()}</div>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 }}>@{username}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.25rem" }}><FiLogOut /></button>
        </div>
      </nav>

      <main style={{ padding: "3rem 2rem", maxWidth: 1000, margin: "0 auto" }}>
        {pendingBills > 0 && (
          <Link href="/customer/billing" style={{ textDecoration: "none" }}>
            <div className="card animate-fade-up" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", padding: "1.25rem 2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--brand-error)" }}>
                <FiAlertCircle style={{ fontSize: "1.5rem" }} />
                <div>
                  <div style={{ fontWeight: 800 }}>{pendingBills} Pending Invoice{pendingBills > 1 ? "s" : ""}</div>
                  <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>Please clear your dues to continue receiving tiffins.</div>
                </div>
              </div>
              <FiChevronRight />
            </div>
          </Link>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }}>
          <div>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem", letterSpacing: "-0.04em" }}>My Tiffins</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Subscribed providers and meal plans.</p>
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "0.75rem 1.5rem" }} onClick={() => setShowFind(true)}>
            <FiPlus /> Find Provider
          </button>
        </div>

        {loading ? <div style={{ textAlign: "center", padding: "4rem" }}><span className="spinner" /></div> : providers.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "5rem 2rem", borderStyle: "dashed" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1.5rem", opacity: 0.5 }}>🍱</div>
            <h2 style={{ color: "#fff", fontSize: "1.25rem", marginBottom: "0.5rem" }}>No subscriptions found</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Start by finding a provider in your area.</p>
            <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowFind(true)}>Discover Providers</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {providers.map(p => {
              const isOverdue = p.mealPlan?.endDate ? new Date(p.mealPlan.endDate) < today : false;
              return (
                <div key={p._id} className="card animate-fade-up" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", marginBottom: "0.25rem" }}>{p.providerId?.displayName}</h3>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>@{p.providerId?.username}</p>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Badge label={p.tiffinStatus === "active" ? "Active" : "On Hold"} type={p.tiffinStatus === "active" ? "success" : "default"} />
                        {isOverdue && <Badge label="Expired" type="error" />}
                      </div>
                    </div>
                    <button onClick={() => removeProvider(p._id)} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.5rem" }}><FiTrash2 /></button>
                  </div>

                  {p.mealPlan && (
                    <div style={{ background: "var(--surface-2)", borderRadius: "var(--radius-md)", padding: "1.25rem", fontSize: "0.9rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Plan</span>
                        <span style={{ fontWeight: 700, color: "#fff" }}>{p.mealPlan.planType}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Rate</span>
                        <span style={{ fontWeight: 700, color: "#fff" }}>₹{p.mealPlan.rate}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-muted)" }}>Meals</span>
                        <span style={{ fontWeight: 700, color: "#fff" }}>{p.mealPlan.meals.join(", ")}</span>
                      </div>
                      
                      {(p.mealPlan.mealQuota ?? 0) > 0 && (
                        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.75rem", fontWeight: 800 }}>
                            <span style={{ color: "var(--text-muted)", textTransform: "uppercase" }}>Quota</span>
                            <span style={{ color: "var(--brand-primary)" }}>{p.mealPlan.mealsConsumed} / {p.mealPlan.mealQuota}</span>
                          </div>
                          <div style={{ height: 6, background: "var(--surface-0)", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(p.mealPlan.mealsConsumed! / p.mealPlan.mealQuota!) * 100}%`, background: "var(--brand-primary)", borderRadius: 3, boxShadow: "0 0 8px var(--brand-primary)" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <button className="btn-primary" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.85rem" }} onClick={() => setViewProvider({ record: p, tab: "today" })}>
                      View Menu
                    </button>
                    <button className="btn-primary" style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "#fff", fontSize: "0.85rem" }} onClick={() => setViewProvider({ record: p, tab: "full" })}>
                      Menu Card
                    </button>
                  </div>

                  {p.mealPlan && p.tiffinStatus === "active" && !isOverdue && <AdjustMealsCard record={p} />}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showFind && <FindProviderModal onClose={() => setShowFind(false)} onAdded={r => setProviders(prev => [r, ...prev])} />}
      {viewProvider && <ProviderDetailsModal record={viewProvider.record} initialTab={viewProvider.tab} onClose={() => setViewProvider(null)} />}
    </div>
  );
}
