// Shared types for the BizzChat AI Copilot.
// Kept in one place so future features (voice, file upload, agent handoff,
// multi-agent workflows) can extend these without touching every component.

export type MessageRole = "user" | "assistant" | "system";

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** Optional structured card payload returned by the AI service. */
  visual_type?: string;
  data?: any;
  createdAt: number;
  /** Marks locally-generated status messages (e.g. ticket confirmations). */
  local?: boolean;
}

/** Future-ready attachment descriptor (file / pdf / image / audio). */
export interface CopilotAttachment {
  id: string;
  kind: "file" | "pdf" | "image" | "audio";
  name: string;
  url?: string;
  size?: number;
}

export interface CopilotContextValue {
  // ── Visibility ─────────────────────────────
  isOpen: boolean;
  isMobile: boolean;
  unreadCount: number;
  open: () => void;
  close: () => void;
  minimize: () => void;
  toggle: () => void;

  // ── Conversation ───────────────────────────
  messages: CopilotMessage[];
  isLoading: boolean;
  ttsEnabled: boolean;
  toggleTts: () => void;
  sendMessage: (text: string) => Promise<void>;
  pushAssistantMessage: (content: string) => void;
  clearChat: () => void;
}
