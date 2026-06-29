"use client";

// Message composer for BizzChat with voice input (Web Speech API).
//
// Voice flow mirrors the proven /ai page behaviour: request the mic once, run a
// single-shot recognition in the chosen language, stream the transcript into
// the input, and auto-send when the browser stops listening (silence). The
// attach control stays a future-ready placeholder for file / pdf / image upload.

import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  /** Adds extra bottom padding for the mobile safe-area / keyboard. */
  safeArea?: boolean;
}

const LANGS = [
  { code: "en-IN", label: "EN" },
  { code: "hi-IN", label: "HI" },
  { code: "gu-IN", label: "GU" },
];

export default function ChatInput({ onSend, disabled, safeArea }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [sttLang, setSttLang] = useState("en-IN");
  const [voiceSupported, setVoiceSupported] = useState(false);

  const valueRef = useRef("");
  const recognitionRef = useRef<any>(null);
  const micGrantedRef = useRef(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Detect voice support on mount; tidy up any live recognition on unmount.
  useEffect(() => {
    const detect = () =>
      setVoiceSupported(
        typeof window !== "undefined" &&
          !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
      );
    detect();
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    valueRef.current = "";
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    send(value);
  };

  // Acquire the mic only once — re-requesting before each recognition contends
  // with the mic that webkitSpeechRecognition grabs itself on mobile.
  const ensureMic = async (): Promise<boolean> => {
    if (micGrantedRef.current) return true;
    if (!navigator.mediaDevices?.getUserMedia) {
      micGrantedRef.current = true;
      return true;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      micGrantedRef.current = true;
      return true;
    } catch {
      alert(
        "Microphone access denied. Please allow microphone permissions in your browser settings to use voice input."
      );
      return false;
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (!(await ensureMic())) return;

    try {
      // Dispose any previous instance to avoid stale handlers firing.
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = sttLang;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Write the ref synchronously so onend reliably sees the latest text.
        const next = valueRef.current ? `${valueRef.current} ${transcript}` : transcript;
        valueRef.current = next;
        setValue(next);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => {
        setIsRecording(false);
        // Auto-send when the browser naturally stops listening (silence).
        if (valueRef.current.trim()) send(valueRef.current);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
    }
  };

  const sendDisabled = disabled || !value.trim();

  return (
    <form
      onSubmit={submit}
      suppressHydrationWarning
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        padding: "0.7rem",
        paddingBottom: safeArea ? "calc(0.7rem + env(safe-area-inset-bottom, 0px))" : "0.7rem",
        borderTop: "1px solid var(--border-color)",
        background: "var(--bg-primary)",
        flexShrink: 0,
      }}
    >
      {/* Future-ready: file / pdf / image upload */}
      <button
        type="button"
        disabled
        title="Attachments — coming soon"
        aria-label="Attach a file (coming soon)"
        style={{
          background: "none",
          border: "none",
          color: "var(--text-secondary)",
          cursor: "not-allowed",
          opacity: 0.5,
          fontSize: "1rem",
          width: "32px",
          height: "34px",
          borderRadius: "var(--radius-md)",
          flexShrink: 0,
        }}
      >
        <i className="fa-solid fa-paperclip" />
      </button>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isRecording ? "Listening… pause to send" : "Ask BizzChat…"}
        aria-label="Message BizzChat"
        style={{
          flex: 1,
          minWidth: 0,
          padding: "0.7rem 0.85rem",
          borderRadius: "var(--radius-full)",
          border: "1px solid var(--border-color)",
          background: "var(--bg-secondary)",
          color: "var(--text-primary)",
          fontSize: "0.95rem",
          outline: "none",
        }}
      />

      {voiceSupported && (
        <>
          <select
            value={sttLang}
            onChange={(e) => setSttLang(e.target.value)}
            title="Voice language"
            aria-label="Voice language"
            style={{
              padding: "0.45rem 0.3rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              outline: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              flexShrink: 0,
            }}
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={toggleRecording}
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
            title={isRecording ? "Stop listening" : "Voice input"}
            className={isRecording ? "bizz-mic bizz-mic--on" : "bizz-mic"}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: isRecording ? "#ef4444" : "var(--bg-secondary)",
              color: isRecording ? "#fff" : "var(--text-primary)",
              cursor: "pointer",
              flexShrink: 0,
              transition: "background var(--transition-fast)",
            }}
          >
            <i className="fa-solid fa-microphone" />
          </button>
        </>
      )}

      <button
        type="submit"
        disabled={sendDisabled}
        aria-label="Send message"
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "var(--radius-full)",
          border: "none",
          background: sendDisabled ? "var(--border-color)" : "var(--accent-primary)",
          color: "#fff",
          cursor: sendDisabled ? "default" : "pointer",
          flexShrink: 0,
          transition: "background var(--transition-fast)",
        }}
      >
        <i className="fa-solid fa-paper-plane" />
      </button>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bizz-mic--on { animation: bizzMicPulse 1.5s infinite; }
            @keyframes bizzMicPulse {
              0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
              70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
              100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
            }
            @media (prefers-reduced-motion: reduce) { .bizz-mic--on { animation: none; } }
          `,
        }}
      />
    </form>
  );
}
