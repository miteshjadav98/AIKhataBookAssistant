"use client";

// Floating launcher button — fixed bottom-right, visible across the CRM.
// Shows an unread badge and a subtle pulse to draw attention.

import { useCopilot } from "./CopilotProvider";

export default function CopilotLauncher() {
  const { isOpen, unreadCount, toggle } = useCopilot();

  return (
    <>
      <button
        onClick={toggle}
        aria-label={isOpen ? "Close BizzChat" : "Open BizzChat AI Copilot"}
        title="BizzChat — AI Copilot"
        className="bizz-launcher"
        style={{
          position: "fixed",
          bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
          right: "calc(1.5rem + env(safe-area-inset-right, 0px))",
          width: "60px",
          height: "60px",
          borderRadius: "var(--radius-full)",
          border: "none",
          cursor: "pointer",
          zIndex: 1200,
          background: "var(--accent-gradient)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "var(--shadow-lg)",
          transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
        }}
      >
        <i
          className={`fa-solid ${isOpen ? "fa-xmark" : "fa-wand-magic-sparkles"}`}
          style={{ fontSize: "1.4rem" }}
        />
        {!isOpen && unreadCount > 0 && (
          <span
            className="bizz-badge"
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              minWidth: "20px",
              height: "20px",
              padding: "0 5px",
              borderRadius: "var(--radius-full)",
              background: "#ef4444",
              color: "#fff",
              fontSize: "0.7rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-primary)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bizz-launcher:hover { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(99,102,241,0.18), var(--shadow-lg); }
            .bizz-launcher:active { transform: scale(0.96); }
            .bizz-launcher::after {
              content: "";
              position: absolute;
              inset: 0;
              border-radius: var(--radius-full);
              box-shadow: 0 0 0 0 rgba(99,102,241,0.45);
              animation: bizzPulse 2.4s infinite;
            }
            @keyframes bizzPulse {
              0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.45); }
              70% { box-shadow: 0 0 0 14px rgba(99,102,241,0); }
              100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .bizz-launcher::after { animation: none; }
            }
          `,
        }}
      />
    </>
  );
}
