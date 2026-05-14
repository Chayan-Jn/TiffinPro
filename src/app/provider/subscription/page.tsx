"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Script from "next/script";
import { FiCheck, FiZap, FiCalendar, FiArrowRight, FiShield } from "react-icons/fi";
import { LuUtensils } from "react-icons/lu";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function ProviderSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expiry, setExpiry] = useState<Date | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/provider/subscription/history");
      const data = await res.json();
      if (data.subscriptionExpiry) {
        setExpiry(new Date(data.subscriptionExpiry));
      }
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = expiry ? expiry < new Date() : true;
  const hasPaid = history.some(h => h.status === "paid");
  const isActiveTrial = !isExpired && !hasPaid;

  const handlePayment = async (plan: "monthly" | "yearly") => {
    setPayingPlan(plan);
    try {
      const orderRes = await fetch("/api/provider/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "TiffinPro Premium",
        description: `TiffinPro ${plan.charAt(0).toUpperCase() + plan.slice(1)} Access`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/provider/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("Welcome to TiffinPro Premium!");
            fetchData();
            router.push("/provider/dashboard");
          } else {
            toast.error("Payment verification failed.");
          }
        },
        theme: {
          color: "#FF6B35",
        },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on("payment.failed", function (response: any) {
        toast.error(`Payment Failed: ${response.error.description}`);
      });
      rzp1.open();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPayingPlan(null);
    }
  };

  return (
    <div className="animate-fade-up">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 0" }}>
        
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{ width: 64, height: 64, background: "var(--brand)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 12px 24px var(--brand-glow)" }}>
            <LuUtensils style={{ color: "#fff", fontSize: "2rem" }} />
          </div>
          <h1 style={{ fontSize: "3rem", fontWeight: 950, color: "#fff", letterSpacing: "-0.04em", marginBottom: "0.75rem" }}>
            TiffinPro <span style={{ color: "var(--brand)" }}>Premium</span>
          </h1>
          <p style={{ color: "var(--t2)", fontSize: "1.2rem", fontWeight: 500 }}>Unlock professional tools for your tiffin business.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem" }}><span className="spinner" /></div>
        ) : (
          <>
            {/* Status Card */}
            <div className="card" style={{
              background: isExpired ? "rgba(239,68,68,0.03)" : "rgba(34,197,94,0.03)",
              borderColor: isExpired ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              padding: "2rem 2.5rem",
              marginBottom: "3.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: "1.25rem", fontWeight: 900, color: isExpired ? "var(--red)" : "var(--green)", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {isExpired ? "Subscription Expired" : isActiveTrial ? "7-Day Free Trial" : "Active Subscription"}
                  {isActiveTrial && <span style={{ background: "rgba(34,197,94,0.1)", padding: "4px 10px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", border: "1px solid rgba(34,197,94,0.2)" }}>Trial</span>}
                </div>
                <p style={{ color: "var(--t3)", fontWeight: 600 }}>
                  {expiry ? (
                    <>Valid until <strong style={{ color: "#fff" }}>{expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong></>
                  ) : "No active subscription history."}
                </p>
              </div>
              {!isExpired && (
                <button onClick={() => router.push("/provider/dashboard")} className="btn-ghost" style={{ width: "auto", padding: "0.8rem 1.5rem" }}>
                  Back to Dashboard <FiArrowRight />
                </button>
              )}
            </div>

            {/* Pricing Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem", marginBottom: "5rem" }}>
              
              {/* Monthly */}
              <div className="card hover-lift-up" style={{ padding: "3rem", background: "var(--s1)", display: "flex", flexDirection: "column", gap: "2rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Professional</h3>
                  <p style={{ color: "var(--t3)", fontWeight: 600 }}>Perfect for small startups.</p>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                  <span style={{ fontSize: "3.5rem", fontWeight: 950, color: "#fff", letterSpacing: "-0.05em" }}>₹9</span>
                  <span style={{ fontSize: "1.1rem", color: "var(--t3)", fontWeight: 700 }}>/ month</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontWeight: 600 }}><FiCheck style={{ color: "var(--brand)" }} /> Unlimited Customers</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontWeight: 600 }}><FiCheck style={{ color: "var(--brand)" }} /> Daily Deliveries Log</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontWeight: 600 }}><FiCheck style={{ color: "var(--brand)" }} /> Digital Billing & Invoices</div>
                </div>
                <button 
                  disabled={payingPlan !== null}
                  onClick={() => handlePayment("monthly")}
                  className="btn-ghost" 
                  style={{ marginTop: "auto", height: "60px", fontSize: "1.05rem" }}
                >
                  {payingPlan === "monthly" ? "Processing..." : "Get Started"}
                </button>
              </div>

              {/* Yearly */}
              <div className="card hover-lift-up" style={{ 
                padding: "3rem", 
                background: "var(--s1)", 
                borderColor: "var(--brand)", 
                display: "flex", 
                flexDirection: "column", 
                gap: "2rem", 
                position: "relative",
                boxShadow: "0 24px 48px rgba(255,107,53,0.1)"
              }}>
                <div style={{ position: "absolute", top: -15, right: 30, background: "var(--brand)", color: "#fff", padding: "6px 16px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 900, boxShadow: "0 4px 12px var(--brand-glow)" }}>BEST VALUE</div>
                <div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 900, color: "#fff", marginBottom: "0.5rem" }}>Enterprise</h3>
                  <p style={{ color: "var(--t3)", fontWeight: 600 }}>For growing food businesses.</p>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
                  <span style={{ fontSize: "3.5rem", fontWeight: 950, color: "var(--brand)", letterSpacing: "-0.05em" }}>₹19</span>
                  <span style={{ fontSize: "1.1rem", color: "var(--t3)", fontWeight: 700 }}>/ year</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontWeight: 600 }}><FiCheck style={{ color: "var(--brand)" }} /> Everything in Monthly</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontWeight: 600 }}><FiCheck style={{ color: "var(--brand)" }} /> Priority Support</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--t2)", fontWeight: 600 }}><FiShield style={{ color: "var(--brand)" }} /> Early Access Features</div>
                </div>
                <button 
                  disabled={payingPlan !== null}
                  onClick={() => handlePayment("yearly")}
                  className="btn-primary" 
                  style={{ marginTop: "auto", height: "60px", fontSize: "1.05rem" }}
                >
                  {payingPlan === "yearly" ? "Processing..." : "Upgrade Now"}
                </button>
              </div>

            </div>

            {/* History Table */}
            <h2 style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <FiCalendar style={{ color: "var(--brand)" }} /> Billing History
            </h2>
            {history.length === 0 ? (
              <div className="card" style={{ padding: "4rem", textAlign: "center", borderStyle: "dashed", color: "var(--t4)", fontWeight: 600 }}>
                No past transactions found.
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--s1)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                  <thead style={{ background: "var(--s2)", borderBottom: "1px solid var(--bd)" }}>
                    <tr>
                      <th style={{ padding: "1.25rem 2rem", textAlign: "left", color: "var(--t3)", fontWeight: 800 }}>Date</th>
                      <th style={{ padding: "1.25rem 2rem", textAlign: "left", color: "var(--t3)", fontWeight: 800 }}>Plan</th>
                      <th style={{ padding: "1.25rem 2rem", textAlign: "left", color: "var(--t3)", fontWeight: 800 }}>Amount</th>
                      <th style={{ padding: "1.25rem 2rem", textAlign: "right", color: "var(--t3)", fontWeight: 800 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h) => (
                      <tr key={h._id} style={{ borderBottom: "1px solid var(--bd)" }}>
                        <td style={{ padding: "1.25rem 2rem", color: "#fff", fontWeight: 600 }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: "1.25rem 2rem", color: "#fff", fontWeight: 700, textTransform: "capitalize" }}>{h.plan}</td>
                        <td style={{ padding: "1.25rem 2rem", color: "var(--brand)", fontWeight: 900 }}>₹{h.amount}</td>
                        <td style={{ padding: "1.25rem 2rem", textAlign: "right" }}>
                          {h.status === "paid" ? (
                            <span style={{ color: "var(--green)", fontWeight: 800, fontSize: "0.8rem", background: "rgba(34,197,94,0.1)", padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.15)" }}>PAID</span>
                          ) : (
                            <span style={{ color: "var(--red)", fontWeight: 800, fontSize: "0.8rem", background: "rgba(239,68,68,0.1)", padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.15)" }}>{h.status.toUpperCase()}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
