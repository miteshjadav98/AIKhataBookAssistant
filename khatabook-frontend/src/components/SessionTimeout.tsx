"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function SessionTimeout() {
  const pathname = usePathname();
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  // For testing: const IDLE_TIMEOUT_MS = 10 * 1000; // 10 seconds

  const resetTimers = () => {
    // If the warning is already showing, we don't automatically reset on mouse move
    // They must explicitly click "Continue Session"
    if (showWarning) return;

    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    activityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(600); // 10 minutes
    }, IDLE_TIMEOUT_MS);
  };

  const handleContinue = () => {
    setShowWarning(false);
    resetTimers();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  useEffect(() => {
    // Skip timeout logic for AI Chat (it handles its own 15m timeout) and public auth routes
    if (!pathname || pathname.startsWith("/ai") || pathname.startsWith("/auth") || pathname === "/") {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      setShowWarning(false);
      return;
    }

    // Only run if user is actually logged in
    const token = localStorage.getItem("token");
    if (!token) return;

    // Attach activity listeners
    window.addEventListener("mousemove", resetTimers);
    window.addEventListener("keydown", resetTimers);
    window.addEventListener("click", resetTimers);
    window.addEventListener("scroll", resetTimers);
    
    // Initialize
    resetTimers();

    return () => {
      window.removeEventListener("mousemove", resetTimers);
      window.removeEventListener("keydown", resetTimers);
      window.removeEventListener("click", resetTimers);
      window.removeEventListener("scroll", resetTimers);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [pathname, showWarning]); // Re-bind if showWarning changes so we don't reset while warning is up

  useEffect(() => {
    if (showWarning) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showWarning]);

  if (!showWarning) return null;

  // Format countdown mm:ss
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(4px)",
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "2rem",
        maxWidth: "400px",
        width: "90%",
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}>
        <div style={{
          width: "60px", height: "60px",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", margin: "0 auto 1.5rem"
        }}>
          <i className="fa-solid fa-clock"></i>
        </div>
        <h2 style={{ color: "var(--text-primary)", marginBottom: "1rem", fontSize: "1.5rem" }}>
          Session Expiring Soon
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
          You've been idle for a while. For your security, your session will automatically expire in <strong>{formattedTime}</strong>.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <button 
            onClick={handleLogout}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: "transparent",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 500
            }}
          >
            Log Out Now
          </button>
          <button 
            onClick={handleContinue}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent-primary)",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
              boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)"
            }}
          >
            Continue Session
          </button>
        </div>
      </div>
    </div>
  );
}
