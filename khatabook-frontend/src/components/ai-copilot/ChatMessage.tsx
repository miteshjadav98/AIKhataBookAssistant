"use client";

// Renders a single chat bubble plus any structured visual card returned by
// the AI service. Visual cards are reused from the existing /ai experience.

import LedgerCard from "@/components/ai/LedgerCard";
import InvoicePreviewCard from "@/components/ai/InvoicePreviewCard";
import SalesSummaryCard from "@/components/ai/SalesSummaryCard";
import LowStockAlertCard from "@/components/ai/LowStockAlertCard";
import type { CopilotMessage } from "./types";

function renderVisual(msg: CopilotMessage) {
  if (!msg.visual_type || !msg.data) return null;
  switch (msg.visual_type) {
    case "ledger_summary":
      return <LedgerCard data={msg.data} />;
    case "invoice_preview":
      return <InvoicePreviewCard data={msg.data} />;
    case "sales_summary":
      return <SalesSummaryCard data={msg.data} />;
    case "low_stock_alert":
      return <LowStockAlertCard data={msg.data} />;
    default:
      return null;
  }
}

export default function ChatMessage({ msg }: { msg: CopilotMessage }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";

  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "85%",
          padding: "0.7rem 0.85rem",
          borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          background: isUser
            ? "var(--accent-primary)"
            : isSystem
            ? "var(--glass-bg)"
            : "var(--bg-secondary)",
          color: isUser ? "#fff" : "var(--text-primary)",
          border: isUser ? "none" : "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-sm)",
          fontSize: "0.9rem",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {!isUser && (
          <div
            style={{
              marginBottom: "0.3rem",
              fontWeight: 700,
              fontSize: "0.72rem",
              opacity: 0.75,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <i className={`fa-solid ${isSystem ? "fa-circle-info" : "fa-wand-magic-sparkles"}`} />
            {isSystem ? "System" : "BizzChat"}
          </div>
        )}

        {msg.content && (
          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br>") }} />
        )}

        {msg.role === "assistant" && msg.visual_type && (
          <div style={{ marginTop: "0.75rem" }}>{renderVisual(msg)}</div>
        )}
      </div>
    </div>
  );
}
