"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
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

const LEFT_FEATURES = [
  { icon: "👥", text: "Manage customers & credit ledgers" },
  { icon: "📊", text: "Real-time dashboard & analytics" },
  { icon: "🤖", text: "AI Copilot" },
  { icon: "📄", text: "Generate reports & export data" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleCallback = useCallback(async (response: any) => {
    setIsGoogleLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google sign-in failed");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [router]);

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
      const btnContainer = document.getElementById("google-signin-btn-login");
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

    if (window.google?.accounts?.id) { renderGoogleButton(); return; }

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
    return () => { script.removeEventListener("load", renderGoogleButton); };
  }, [handleGoogleCallback]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to login");
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ── Left branding panel ─────────────────────────── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftInner}>
          <Link href="/" className={styles.leftLogo}>
            Mitek<span>One</span>
          </Link>
          <div className={styles.leftBody}>
            <h2 className={styles.leftHeading}>
              Everything you need to<br />run your business
            </h2>
            <p className={styles.leftSubtext}>
              Join hundreds of businesses already managing customers, tracking payments,
              and growing with AI-powered insights.
            </p>
            <ul className={styles.leftFeatures}>
              {LEFT_FEATURES.map((f) => (
                <li key={f.text}>
                  <span className={styles.featureIcon}>{f.icon}</span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.leftStats}>
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>500+</span>
              <span className={styles.leftStatLabel}>Businesses</span>
            </div>
            <div className={styles.leftStatDivider} />
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>10k+</span>
              <span className={styles.leftStatLabel}>Transactions</span>
            </div>
            <div className={styles.leftStatDivider} />
            <div className={styles.leftStat}>
              <span className={styles.leftStatNum}>AI</span>
              <span className={styles.leftStatLabel}>Powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────── */}
      <div className={styles.rightPanel}>
        <div className={`${styles.authCard} glass-panel animate-fade-in`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in to manage your shop</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
            <div className={styles.googleSection}>
              <div id="google-signin-btn-login" className={styles.googleBtnWrapper} />
              {isGoogleLoading && (
                <div className={styles.googleLoading}>
                  <div className={styles.spinner} />
                  <span>Signing in with Google…</span>
                </div>
              )}
            </div>
          )}

          {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
            <div className={styles.divider}>
              <span className={styles.dividerText}>or continue with email</span>
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin} suppressHydrationWarning={true}>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className={styles.footer}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className={styles.link}>Register here</Link>
          </div>

          <div className={styles.backHome}>
            <Link href="/" className={styles.backHomeLink}>
              <i className="fa-solid fa-arrow-left" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
