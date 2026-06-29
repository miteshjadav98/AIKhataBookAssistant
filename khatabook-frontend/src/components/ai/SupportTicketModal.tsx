"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface SupportTicketModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = ["PAYMENT", "INVOICE", "HARDWARE", "PERFORMANCE", "AUTH", "FEATURE_REQUEST", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
  RESOLVED: "#10b981",
  CLOSED: "#6b7280",
};

export default function SupportTicketModal({ open, onClose }: SupportTicketModalProps) {
  const [category, setCategory] = useState("PAYMENT");
  const [priority, setPriority] = useState("MEDIUM");
  const [issueSummary, setIssueSummary] = useState("");
  const [issueDetails, setIssueDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await apiFetch("/support/tickets");
      setTickets(Array.isArray(res?.data) ? res.data : []);
    } catch (e: any) {
      setFeedback({ type: "err", text: e.message || "Could not load tickets" });
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (open) {
      setFeedback(null);
      loadTickets();
    }
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueSummary.trim()) {
      setFeedback({ type: "err", text: "Please enter a short summary of the issue." });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch("/support/tickets", {
        method: "POST",
        body: JSON.stringify({ category, priority, issueSummary, issueDetails }),
      });
      const id = res?.data?.id;
      setFeedback({ type: "ok", text: `Ticket created${id ? ` (#${String(id).slice(0, 8)})` : ""}. Our team will follow up.` });
      setIssueSummary("");
      setIssueDetails("");
      await loadTickets();
    } catch (e: any) {
      setFeedback({ type: "err", text: e.message || "Failed to create ticket" });
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.7rem",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    outline: "none",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1400,
        display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "2rem 1rem", overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel"
        style={{ width: "100%", maxWidth: "560px", padding: "1.5rem", borderRadius: "14px", background: "var(--bg-primary)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
            <i className="fa-solid fa-life-ring" style={{ color: "#3b82f6" }}></i> Support
          </h3>
          <button onClick={onClose} className="icon-btn" title="Close" style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <label style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...fieldStyle, marginTop: "0.3rem", cursor: "pointer" }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
            </label>
            <label style={{ flex: 1, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...fieldStyle, marginTop: "0.3rem", cursor: "pointer" }}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>

          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Summary
            <input
              type="text"
              value={issueSummary}
              onChange={(e) => setIssueSummary(e.target.value)}
              placeholder="e.g. Payment not reflected"
              maxLength={120}
              style={{ ...fieldStyle, marginTop: "0.3rem" }}
            />
          </label>

          <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Details (optional)
            <textarea
              value={issueDetails}
              onChange={(e) => setIssueDetails(e.target.value)}
              placeholder="Describe what happened, steps to reproduce, etc."
              rows={3}
              style={{ ...fieldStyle, marginTop: "0.3rem", resize: "vertical" }}
            />
          </label>

          {feedback && (
            <div style={{ fontSize: "0.85rem", color: feedback.type === "ok" ? "#10b981" : "#ef4444" }}>
              <i className={`fa-solid ${feedback.type === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}`}></i> {feedback.text}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={submitting || !issueSummary.trim()} style={{ padding: "0.7rem", borderRadius: "8px" }}>
            {submitting ? "Submitting..." : "Raise Ticket"}
          </button>
        </form>

        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>Your recent tickets</strong>
            <button onClick={loadTickets} className="icon-btn" title="Refresh" style={{ color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          {loadingTickets ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Loading...</p>
          ) : tickets.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>No tickets yet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "180px", overflowY: "auto" }}>
              {tickets.map((t) => (
                <li key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--glass-border)", background: "var(--glass-bg)" }}>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ color: "var(--text-primary)", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.issueSummary}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem" }}>{t.category} · {t.priority}</div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "999px", color: "white", background: STATUS_COLORS[t.status] || "#6b7280" }}>
                    {String(t.status || "").replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
