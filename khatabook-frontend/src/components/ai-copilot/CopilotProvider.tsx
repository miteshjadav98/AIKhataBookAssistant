"use client";

// CopilotProvider — global state + mount point for the BizzChat AI Copilot.
//
// Mounted once from the root layout so the conversation survives client-side
// navigation between CRM pages (the provider never unmounts). Conversation
// state is mirrored to sessionStorage so a full page reload also restores it.
//
// The heavy chat UI (widget / fullscreen) is lazy-loaded via next/dynamic and
// only requested the first time the user opens BizzChat, keeping it out of the
// initial bundle.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import type { CopilotContextValue, CopilotMessage } from "./types";
import CopilotLauncher from "./CopilotLauncher";

// Lazy-loaded surfaces — client only, fetched on first open.
const CopilotWidget = dynamic(() => import("./CopilotWidget"), { ssr: false });
const CopilotMobile = dynamic(() => import("./CopilotMobile"), { ssr: false });

const THREAD_KEY = "bizzchat_thread_id";
const MESSAGES_KEY = "bizzchat_messages";
const MOBILE_BREAKPOINT = 768;

// Routes where the floating Copilot should stay hidden:
// - the dedicated /ai full-page chat (redundant there)
// - unauthenticated auth screens
const HIDDEN_PREFIXES = ["/ai", "/auth"];

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) {
    throw new Error("useCopilot must be used within <CopilotProvider>");
  }
  return ctx;
}

function greeting(name?: string): CopilotMessage {
  return {
    id: uuidv4(),
    role: "system",
    content: `Hi ${name || "there"}! I'm <strong>BizzChat</strong>, your AI Copilot. Ask me about your sales, ledgers and stock — or raise a support ticket right here.`,
    createdAt: Date.now(),
    local: true,
  };
}

export default function CopilotProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const threadIdRef = useRef<string>("");
  const userNameRef = useRef<string>("there");
  const isOpenRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsEnabledRef = useRef(true);
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled;
  }, [ttsEnabled]);

  // ── Mount: media query, auth, and conversation restore ──────────────
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const syncIsMobile = () => setIsMobile(mq.matches);

    // Wrapped in a function so the state updates run as a client-only side
    // effect rather than synchronously in the effect body.
    const init = () => {
      setMounted(true);
      syncIsMobile();
      audioRef.current = new Audio();

      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          userNameRef.current = JSON.parse(userStr)?.name || "there";
        }
        // Restore the user's TTS preference (default: on).
        if (localStorage.getItem("bizzchat_tts") === "off") {
          setTtsEnabled(false);
        }
      } catch {
        /* ignore malformed user */
      }

      // Restore prior conversation, or seed a fresh thread + greeting.
      const savedThread = sessionStorage.getItem(THREAD_KEY);
      const savedMessages = sessionStorage.getItem(MESSAGES_KEY);
      if (savedThread && savedMessages) {
        try {
          threadIdRef.current = savedThread;
          setMessages(JSON.parse(savedMessages));
        } catch {
          threadIdRef.current = uuidv4();
          setMessages([greeting(userNameRef.current)]);
        }
      } else {
        threadIdRef.current = uuidv4();
        sessionStorage.setItem(THREAD_KEY, threadIdRef.current);
        setMessages([greeting(userNameRef.current)]);
      }
    };

    init();
    mq.addEventListener("change", syncIsMobile);
    return () => mq.removeEventListener("change", syncIsMobile);
  }, []);

  // Track auth state per route change (token can appear/disappear via login/logout).
  useEffect(() => {
    const syncAuth = () =>
      setIsAuthed(!!(typeof window !== "undefined" && localStorage.getItem("token")));
    syncAuth();
  }, [pathname]);

  // Persist conversation on every change.
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // ── Helpers ─────────────────────────────────────────────────────────
  const appendMessage = useCallback((msg: CopilotMessage) => {
    setMessages((prev) => [...prev, msg]);
    // Badge unread replies that arrive while the panel is closed.
    if (msg.role !== "user" && !isOpenRef.current) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const minimize = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const aiUrl = () =>
    window.location.hostname === "localhost"
      ? "/ai-api/api/chat"
      : "https://ai.miteklabs.tech/api/chat";

  // ── Text-to-speech ──────────────────────────────────────────────────
  const stopAudio = () => {
    try {
      audioRef.current?.pause();
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  };

  // Mobile browsers only allow audio that's "unlocked" during a user gesture.
  // sendMessage runs from a tap/keypress, so we prime the element with a silent
  // clip here; the real reply audio can then autoplay after the network round-trip.
  const unlockAudio = () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.pause();
      audioRef.current.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      const p = audioRef.current.play();
      if (p) p.then(() => audioRef.current?.pause()).catch(() => {});
    } catch {
      /* ignore */
    }
  };

  const playAudioB64 = (b64: string) => {
    if (!ttsEnabledRef.current || !audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = "data:audio/wav;base64," + b64;
    audioRef.current.play().catch(() => {});
  };

  const speakNative = (text: string) => {
    if (!ttsEnabledRef.current || typeof window === "undefined" || !window.speechSynthesis) return;
    // Strip HTML tags / markdown so the speech sounds natural.
    const clean = text.replace(/<[^>]+>/g, " ").replace(/[*_#`]/g, "").trim();
    if (!clean) return;
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(clean));
  };

  const toggleTts = useCallback(() => {
    setTtsEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("bizzchat_tts", next ? "on" : "off");
      }
      if (!next) stopAudio();
      return next;
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      if (!threadIdRef.current) {
        threadIdRef.current = uuidv4();
        sessionStorage.setItem(THREAD_KEY, threadIdRef.current);
      }

      appendMessage({ id: uuidv4(), role: "user", content: trimmed, createdAt: Date.now() });
      setIsLoading(true);

      // Unlock audio inside the originating gesture so TTS can autoplay later.
      if (ttsEnabledRef.current) unlockAudio();
      else stopAudio();

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      try {
        const res = await fetch(aiUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            token,
            thread_id: threadIdRef.current,
            user_name: userNameRef.current,
            // Ask the assistant for Sarvam audio only when TTS is on.
            use_sarvam: ttsEnabledRef.current,
          }),
        });

        if (res.status === 401) {
          appendMessage({
            id: uuidv4(),
            role: "system",
            content: "Your session expired. Please log in again to continue.",
            createdAt: Date.now(),
            local: true,
          });
          return;
        }

        // Parse defensively — a proxy timeout can return an HTML error page.
        const rawBody = await res.text();
        let data: any = {};
        try {
          data = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          appendMessage({
            id: uuidv4(),
            role: "system",
            content: "BizzChat took too long to respond. Please try again in a moment.",
            createdAt: Date.now(),
            local: true,
          });
          return;
        }

        if (res.ok) {
          appendMessage({
            id: uuidv4(),
            role: "assistant",
            content: data.response || "",
            visual_type: data.visual_type,
            data: data.data,
            createdAt: Date.now(),
          });

          // Speak the reply: Sarvam audio if provided, else the browser voice.
          if (data.audio_b64) playAudioB64(data.audio_b64);
          else if (data.response) speakNative(data.response);
        } else {
          const detail =
            typeof data.detail === "object" ? JSON.stringify(data.detail) : data.detail;
          appendMessage({
            id: uuidv4(),
            role: "system",
            content: `Error: ${detail || "Something went wrong."}`,
            createdAt: Date.now(),
            local: true,
          });
        }
      } catch (err: any) {
        appendMessage({
          id: uuidv4(),
          role: "system",
          content: `Network error: ${err?.message || "unable to reach BizzChat."}`,
          createdAt: Date.now(),
          local: true,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, isLoading]
  );

  const pushAssistantMessage = useCallback(
    (content: string) =>
      appendMessage({
        id: uuidv4(),
        role: "assistant",
        content,
        createdAt: Date.now(),
        local: true,
      }),
    [appendMessage]
  );

  const clearChat = useCallback(() => {
    const prevThread = threadIdRef.current;
    // Best-effort reset of server-side memory; ignore failures.
    if (prevThread) {
      const token = localStorage.getItem("token");
      fetch(`${aiUrl()}/${prevThread}?token=${encodeURIComponent(token || "")}`, {
        method: "DELETE",
      }).catch(() => {});
    }
    stopAudio();
    threadIdRef.current = uuidv4();
    sessionStorage.setItem(THREAD_KEY, threadIdRef.current);
    const fresh = [greeting(userNameRef.current)];
    setMessages(fresh);
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo<CopilotContextValue>(
    () => ({
      isOpen,
      isMobile,
      unreadCount,
      open,
      close,
      minimize,
      toggle,
      messages,
      isLoading,
      ttsEnabled,
      toggleTts,
      sendMessage,
      pushAssistantMessage,
      clearChat,
    }),
    [
      isOpen,
      isMobile,
      unreadCount,
      open,
      close,
      minimize,
      toggle,
      messages,
      isLoading,
      ttsEnabled,
      toggleTts,
      sendMessage,
      pushAssistantMessage,
      clearChat,
    ]
  );

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
  const showCopilot = mounted && isAuthed && !hidden;

  return (
    <CopilotContext.Provider value={value}>
      {children}

      {showCopilot && (
        <>
          {/* Launcher stays mounted; panel mounts on demand. */}
          {!(isMobile && isOpen) && <CopilotLauncher />}

          {isOpen && (isMobile ? <CopilotMobile /> : <CopilotWidget />)}
        </>
      )}
    </CopilotContext.Provider>
  );
}
