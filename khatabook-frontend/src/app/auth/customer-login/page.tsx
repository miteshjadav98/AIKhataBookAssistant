"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface ShopOption {
  shopId: string;
  shopName: string;
  shopCode: string;
  totalReceivable: number;
  customerName: string;
}

export default function CustomerLoginPage() {
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shops, setShops] = useState<ShopOption[] | null>(null);
  const [selectingShop, setSelectingShop] = useState(false);
  const [isGoogleLogin, setIsGoogleLogin] = useState(false);
  const [googleCredential, setGoogleCredential] = useState("");
  const router = useRouter();

  const handleGoogleCallback = useCallback(async (response: any) => {
    setLoading(true);
    setError("");
    setIsGoogleLogin(true);
    setGoogleCredential(response.credential);

    try {
      const res = await apiFetch("/customers/login/google", {
        method: "POST",
        body: JSON.stringify({ credential: response.credential }),
      });

      // Multiple shops found — show shop picker
      if (res.multipleShops) {
        setShops(res.shops);
        setSelectingShop(true);
        setLoading(false);
        return;
      }

      completeLogin(res.data);
    } catch (err: any) {
      console.error("[Customer Google Login] Error:", err);
      setError(err.message);
      setIsGoogleLogin(false);
      setLoading(false);
    }
  }, []);

  const isGsiInitialized = useRef(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id_here') return;

    const renderGoogleButton = () => {
      if (!window.google) return;

      if (!isGsiInitialized.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
        });
        isGsiInitialized.current = true;
      }

      const btnContainer = document.getElementById("google-signin-btn-customer");
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    const scriptId = "google-gsi-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    
    script.addEventListener("load", renderGoogleButton);

    return () => {
      script.removeEventListener("load", renderGoogleButton);
    };
  }, [handleGoogleCallback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setIsGoogleLogin(false);

    try {
      const res = await apiFetch("/customers/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      // Multiple shops found — show shop picker
      if (res.multipleShops) {
        setShops(res.shops);
        setSelectingShop(true);
        setLoading(false);
        return;
      }

      // Single shop — auto-login
      completeLogin(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShopSelect = async (shopId: string) => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (isGoogleLogin) {
        res = await apiFetch("/customers/login/google", {
          method: "POST",
          body: JSON.stringify({ credential: googleCredential, shopId }),
        });
      } else {
        res = await apiFetch("/customers/login", {
          method: "POST",
          body: JSON.stringify({ ...form, shopId }),
        });
      }
      completeLogin(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({ ...data.customer, type: "CUSTOMER" }));

    if (data.customer.isTemporaryPassword) {
      router.push("/auth/change-password");
    } else {
      router.push("/my-khata");
    }
  };

  // Shop Selection Screen
  if (selectingShop && shops) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
        <div className="glass-panel animate-fade-in" style={{ padding: "2rem", width: "100%", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", textAlign: "center" }}>
            🏪 Select Your Shop
          </h1>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
            Your account is linked to {shops.length} shops. Choose one to view your Khata.
          </p>

          {error && <p className="form-error" style={{ marginBottom: "1rem", textAlign: "center" }}>❌ {error}</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {shops.map((shop) => (
              <button
                key={shop.shopId}
                onClick={() => handleShopSelect(shop.shopId)}
                disabled={loading}
                className="glass-panel"
                style={{
                  padding: "1.25rem",
                  cursor: "pointer",
                  textAlign: "left",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  transition: "all 0.2s",
                  background: "var(--bg-secondary)",
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent-blue)")}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-color)")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>🏪 {shop.shopName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                      Welcome, {shop.customerName}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {shop.totalReceivable > 0 ? (
                      <div>
                        <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "1.1rem" }}>
                          ₹{(shop.totalReceivable || 0).toLocaleString("en-IN")}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#ef4444" }}>due</div>
                      </div>
                    ) : (
                      <span className="badge badge-paid" style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>Clear ✓</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <button 
            className="btn-secondary" 
            style={{ width: "100%", marginTop: "1rem" }} 
            onClick={() => { setSelectingShop(false); setShops(null); }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Login Form
  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
      <div className="glass-panel animate-fade-in" style={{ padding: "2rem", width: "100%", maxWidth: "420px" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem", textAlign: "center" }}>
          🏪 Customer Login
        </h1>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
          Enter your phone/email and password
        </p>

        {error && <p className="form-error" style={{ marginBottom: "1rem", textAlign: "center" }}>❌ {error}</p>}

        {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', width: '100%' }}>
            <div id="google-signin-btn-customer" style={{ minHeight: '40px' }}></div>
          </div>
        )}

        {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', color: 'var(--text-secondary)' }}>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', borderTop: 'none' }} />
            <span style={{ padding: '0 1rem', fontSize: '0.85rem' }}>or login with credentials</span>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', borderTop: 'none' }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Phone or Email *</label>
            <input className="form-input" placeholder="9876543210 or email" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input className="form-input" type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "0.5rem", fontSize: "1.05rem", padding: "0.85rem" }} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
