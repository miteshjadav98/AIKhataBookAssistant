"use client";

// Shared header for the BizzChat panel (desktop widget + mobile fullscreen).
// `variant` switches the leading control: a minimize button on desktop,
// a back arrow on mobile.

import { useCopilot } from "./CopilotProvider";

interface CopilotHeaderProps {
  variant: "desktop" | "mobile";
}

export default function CopilotHeader({ variant }: CopilotHeaderProps) {
  const { close, minimize, clearChat, ttsEnabled, toggleTts } = useCopilot();

  return (
    <header
      className="glass-panel"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: variant === "mobile" ? "0.9rem 1rem" : "0.9rem 1.1rem",
        borderRadius: 0,
        borderBottom: "1px solid var(--border-color)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", minWidth: 0 }}>
        {variant === "mobile" && (
          <button
            onClick={close}
            aria-label="Back"
            className="icon-btn"
            style={{
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: "0.25rem",
            }}
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
        )}
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "var(--radius-full)",
            background: "var(--accent-gradient)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <i className="fa-solid fa-wand-magic-sparkles" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            BizzChat
          </div>
          <div style={{ fontSize: "0.72rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            AI Copilot · Online
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <button
          onClick={toggleTts}
          aria-label={ttsEnabled ? "Mute voice replies" : "Unmute voice replies"}
          title={ttsEnabled ? "Voice replies on" : "Voice replies off"}
          className="icon-btn"
          style={headerBtn(ttsEnabled ? "#10b981" : "var(--text-secondary)")}
        >
          <i className={`fa-solid ${ttsEnabled ? "fa-volume-high" : "fa-volume-xmark"}`} style={{ fontSize: "0.95rem" }} />
        </button>
        <button
          onClick={clearChat}
          aria-label="Clear conversation"
          title="Clear conversation"
          className="icon-btn"
          style={headerBtn("#ef4444")}
        >
          <i className="fa-solid fa-trash-can" style={{ fontSize: "0.9rem" }} />
        </button>
        {variant === "desktop" && (
          <button
            onClick={minimize}
            aria-label="Minimize"
            title="Minimize"
            className="icon-btn"
            style={headerBtn("var(--text-secondary)")}
          >
            <i className="fa-solid fa-minus" />
          </button>
        )}
        <button
          onClick={close}
          aria-label="Close"
          title="Close"
          className="icon-btn"
          style={headerBtn("var(--text-secondary)")}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </header>
  );
}

function headerBtn(color: string): React.CSSProperties {
  return {
    background: "none",
    border: "none",
    color,
    cursor: "pointer",
    fontSize: "1.05rem",
    width: "34px",
    height: "34px",
    borderRadius: "var(--radius-md)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}
