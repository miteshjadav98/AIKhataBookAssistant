"use client";

// Mobile / tablet surface — full-screen chat (100vw × 100dvh) with a sticky
// header (back button) and sticky, safe-area-aware input. Uses 100dvh so the
// on-screen keyboard doesn't crop the input on iOS/Android.

import { useEffect } from "react";
import CopilotHeader from "./CopilotHeader";
import CopilotChatBody from "./CopilotChatBody";

export default function CopilotMobile() {
  // Lock background scroll while the full-screen chat is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="BizzChat AI Copilot"
      className="bizz-mobile"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-primary)",
        zIndex: 1300,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <CopilotHeader variant="mobile" />
      <CopilotChatBody safeArea />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bizz-mobile { animation: bizzMobileIn 0.22s ease-out; }
            @keyframes bizzMobileIn {
              from { opacity: 0; transform: translateY(2%); }
              to   { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .bizz-mobile { animation: none; }
            }
          `,
        }}
      />
    </div>
  );
}
