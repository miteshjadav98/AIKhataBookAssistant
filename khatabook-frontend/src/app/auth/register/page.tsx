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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    shopName: "",
    name: "",
    email: "",
    password: "",
  });
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
      console.log("[Google Register] Response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Google sign-up failed");
      }

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      router.push("/workspace");
    } catch (err: any) {
      console.error("[Google Register] Error:", err);
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

      const btnContainer = document.getElementById("google-signin-btn-register");
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "outline",
          size: "large",
          text: "signup_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
    };

    // If script is already loaded
    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    // Otherwise load it
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("[Register] Response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Failed to register");
      }

      // Store token and user info, then go to dashboard
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      router.push("/dashboard");
    } catch (err: any) {
      console.error("[Register] Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.authCard} glass-panel animate-fade-in`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start managing your shop today</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Google Sign-Up Button */}
        {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
          <div className={styles.googleSection}>
            <div id="google-signin-btn-register" className={styles.googleBtnWrapper}></div>
            {isGoogleLoading && (
              <div className={styles.googleLoading}>
                <div className={styles.spinner}></div>
                <span>Creating account with Google...</span>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        {GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
          <div className={styles.divider}>
            <span className={styles.dividerText}>or register with email</span>
          </div>
        )}

        <form className={styles.form} onSubmit={handleRegister}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="shopName">Shop Name</label>
            <input
              id="shopName"
              type="text"
              className={styles.input}
              placeholder="My Awesome Shop"
              value={formData.shopName}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              className={styles.input}
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={styles.input}
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
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
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className={`btn-primary ${styles.submitBtn}`}
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account?{" "}
          <Link href="/auth/login" className={styles.link}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
