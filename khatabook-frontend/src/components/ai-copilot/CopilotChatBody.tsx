"use client";

// Shared inner content for both the desktop widget and the mobile fullscreen
// surface: scrollable message list, quick-action chips, inline ticket composer
// and the message input. Keeping this in one place avoids duplicating the chat
// logic across the two responsive shells.

import { useEffect, useRef } from "react";
import { useCopilot } from "./CopilotProvider";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface QuickAction {
  label: string;
  icon: string;
  run: (ctx: ReturnType<typeof useCopilot>) => void;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Today's sales", icon: "fa-chart-line", run: (c) => c.sendMessage("Show me today's sales summary") },
  { label: "My ledger", icon: "fa-book", run: (c) => c.sendMessage("Show my ledger summary") },
  { label: "Low stock", icon: "fa-box-open", run: (c) => c.sendMessage("Which products are low on stock?") },
  { label: "Outstanding dues", icon: "fa-indian-rupee-sign", run: (c) => c.sendMessage("Show customers with outstanding dues") },
];

export default function CopilotChatBody({ safeArea }: { safeArea?: boolean }) {
  const ctx = useCopilot();
  const { messages, isLoading, sendMessage } = ctx;
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message / typing indicator.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Show the welcome quick actions only at the very start of a conversation.
  const showWelcome = messages.filter((m) => m.role === "user").length === 0;

  const chip: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.4rem 0.7rem",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--glass-border)",
    background: "var(--glass-bg)",
    color: "var(--text-primary)",
    cursor: "pointer",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.85rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.7rem",
        }}
      >
        {messages.map((m) => (
          <ChatMessage key={m.id} msg={m} />
        ))}

        {showWelcome && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} style={chip} onClick={() => a.run(ctx)} disabled={isLoading}>
                <i className={`fa-solid ${a.icon}`} style={{ color: "var(--accent-primary)" }} />
                {a.label}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "0.7rem 0.9rem",
                background: "var(--bg-secondary)",
                borderRadius: "14px 14px 14px 4px",
                border: "1px solid var(--glass-border)",
              }}
            >
              <span className="bizz-typing">
                <span /><span /><span />
              </span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isLoading} safeArea={safeArea} />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bizz-typing { display: inline-flex; gap: 4px; align-items: center; }
            .bizz-typing span {
              width: 7px; height: 7px; border-radius: 50%;
              background: var(--text-secondary); display: inline-block;
              animation: bizzTyping 1.2s infinite ease-in-out;
            }
            .bizz-typing span:nth-child(2) { animation-delay: 0.2s; }
            .bizz-typing span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes bizzTyping {
              0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
              30% { transform: translateY(-5px); opacity: 1; }
            }
          `,
        }}
      />
    </div>
  );
}
