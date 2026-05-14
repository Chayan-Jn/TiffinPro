"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Script from "next/script";

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
      // 1. Create order
      const orderRes = await fetch("/api/provider/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Open Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: "INR",
        name: "TiffinPro SaaS",
        description: `TiffinPro ${plan.charAt(0).toUpperCase() + plan.slice(1)} Subscription`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          const verifyRes = await fetch("/api/provider/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast.success("Payment successful! Your subscription has been renewed.");
            fetchData();
            router.push("/provider/dashboard");
          } else {
            toast.error("Payment verification failed.");
          }
        },
        theme: {
          color: "#f97316", // brand-orange
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
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div style={{ minHeight: "100dvh", background: "var(--surface-0)", padding: "2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)" }}>TiffinPro Subscription</h1>
            <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Manage your SaaS access and billing</p>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "3rem" }}>Loading subscription data...</p>
          ) : (
            <>
              {/* Status Banner */}
              <div style={{
                background: isExpired ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)",
                border: `1px solid ${isExpired ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem 2rem",
                marginBottom: "3rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: isExpired ? "#f87171" : "#10b981", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {isExpired ? "Subscription Expired" : isActiveTrial ? "7-Day Free Trial Active" : "Subscription Active"}
                    {isActiveTrial && <span style={{ background: "rgba(16,185,129,0.2)", padding: "2px 8px", borderRadius: 20, fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase" }}>Trial</span>}
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {expiry ? (
                      <>Valid until <strong style={{ color: "var(--text-primary)" }}>{expiry.toLocaleDateString()}</strong></>
                    ) : (
                      "No active subscription found."
                    )}
                  </div>
                </div>
                {!isExpired && (
                  <button onClick={() => router.push("/provider/dashboard")} className="btn-primary" style={{ width: "auto" }}>
                    Go to Dashboard →
                  </button>
                )}
              </div>

              {/* Pricing Plans */}
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.5rem" }}>Select a Plan</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "4rem" }}>
                
                {/* Monthly */}
                <div style={{
                  background: "var(--surface-1)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
                  padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem"
                }}>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Monthly Plan</div>
                    <div style={{ color: "var(--text-muted)" }}>30 days access</div>
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--brand-orange)" }}>
                    ₹9 <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/mo</span>
                  </div>
                  <button 
                    disabled={payingPlan !== null}
                    onClick={() => handlePayment("monthly")}
                    className="btn-primary" 
                    style={{ marginTop: "auto" }}
                  >
                    {payingPlan === "monthly" ? "Processing..." : "Subscribe Monthly"}
                  </button>
                </div>

                {/* Yearly */}
                <div style={{
                  background: "var(--surface-1)", border: "2px solid var(--brand-orange)", borderRadius: "var(--radius-lg)",
                  padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative"
                }}>
                  <div style={{ position: "absolute", top: -12, right: 20, background: "var(--brand-orange)", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 800 }}>BEST VALUE</div>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>Yearly Plan</div>
                    <div style={{ color: "var(--text-muted)" }}>365 days access</div>
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--brand-orange)" }}>
                    ₹19 <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/yr</span>
                  </div>
                  <button 
                    disabled={payingPlan !== null}
                    onClick={() => handlePayment("yearly")}
                    className="btn-primary" 
                    style={{ marginTop: "auto", background: "var(--brand-primary)" }}
                  >
                    {payingPlan === "yearly" ? "Processing..." : "Subscribe Yearly"}
                  </button>
                </div>

              </div>

              {/* History Table */}
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1.5rem" }}>Payment History</h2>
              {history.length === 0 ? (
                <div style={{ background: "var(--surface-1)", padding: "2rem", textAlign: "center", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
                  No past payments found.
                </div>
              ) : (
                <div style={{ background: "var(--surface-1)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead style={{ background: "var(--surface-2)", color: "var(--text-secondary)", fontSize: "0.85rem", textTransform: "uppercase" }}>
                      <tr>
                        <th style={{ padding: "1rem 1.5rem" }}>Date</th>
                        <th style={{ padding: "1rem 1.5rem" }}>Plan</th>
                        <th style={{ padding: "1rem 1.5rem" }}>Amount</th>
                        <th style={{ padding: "1rem 1.5rem" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={h._id} style={{ borderTop: "1px solid var(--border)" }}>
                          <td style={{ padding: "1rem 1.5rem", color: "var(--text-primary)" }}>{new Date(h.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: "1rem 1.5rem", color: "var(--text-primary)", textTransform: "capitalize" }}>{h.plan}</td>
                          <td style={{ padding: "1rem 1.5rem", color: "var(--text-primary)", fontWeight: 700 }}>₹{h.amount}</td>
                          <td style={{ padding: "1rem 1.5rem" }}>
                            {h.status === "paid" && <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.85rem", background: "rgba(52,211,153,0.1)", padding: "4px 8px", borderRadius: 4 }}>PAID</span>}
                            {h.status === "created" && <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.85rem", background: "rgba(245,158,11,0.1)", padding: "4px 8px", borderRadius: 4 }}>PENDING</span>}
                            {h.status === "failed" && <span style={{ color: "#f87171", fontWeight: 700, fontSize: "0.85rem", background: "rgba(248,113,113,0.1)", padding: "4px 8px", borderRadius: 4 }}>FAILED</span>}
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
    </>
  );
}
