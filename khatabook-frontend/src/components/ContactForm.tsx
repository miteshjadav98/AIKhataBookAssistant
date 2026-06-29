"use client";

import { useState } from "react";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise((res) => setTimeout(res, 1400));
    setStatus("sent");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const field = (
    label: string,
    key: keyof FormState,
    type = "text",
    placeholder = ""
  ) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
      <label
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required
        className="form-input"
      />
    </div>
  );

  if (status === "sent") {
    return (
      <div
        className="glass-panel"
        style={{
          padding: "2.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            color: "#22c55e",
          }}
        >
          ✓
        </div>
        <h3
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.25rem",
            fontWeight: 700,
          }}
        >
          Message Sent!
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Thank you for reaching out. We will get back to you within 24 hours.
        </p>
        <button className="btn-secondary" onClick={() => setStatus("idle")}>
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form
      className="glass-panel"
      onSubmit={handleSubmit}
      style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <h3
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: "1.2rem",
          fontWeight: 700,
          marginBottom: "0.25rem",
        }}
      >
        Send a Message
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
        className="cf-two-col"
      >
        {field("Your Name", "name", "text", "John Doe")}
        {field("Email Address", "email", "email", "you@example.com")}
      </div>

      {field("Subject", "subject", "text", "How can we help?")}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        <label
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Message
        </label>
        <textarea
          placeholder="Tell us more about your inquiry..."
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          required
          rows={5}
          className="form-input"
          style={{ resize: "vertical" }}
        />
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={status === "sending"}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
      >
        {status === "sending" ? (
          <>
            <i className="fa-solid fa-circle-notch fa-spin" />
            Sending…
          </>
        ) : (
          <>
            Send Message{" "}
            <i className="fa-solid fa-paper-plane" />
          </>
        )}
      </button>
    </form>
  );
}
