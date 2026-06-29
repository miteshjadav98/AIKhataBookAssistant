"use client";

// Desktop / laptop surface — a floating card pinned bottom-right that the user
// can keep open while working in the CRM. The panel is resizable: because it's
// anchored to the bottom-right, drag handles live on the top edge, left edge and
// top-left corner (dragging outward grows it). The chosen size is persisted.

import { useEffect, useRef, useState } from "react";
import CopilotHeader from "./CopilotHeader";
import CopilotChatBody from "./CopilotChatBody";

const DEFAULT_SIZE = { w: 420, h: 650 };
const MIN_W = 340;
const MIN_H = 440;
const SIZE_KEY = "bizzchat_size";

type ResizeDir = "t" | "l" | "tl";

export default function CopilotWidget() {
  const [size, setSize] = useState(DEFAULT_SIZE);
  const sizeRef = useRef(size);
  const dragRef = useRef<{ x: number; y: number; w: number; h: number; dir: ResizeDir } | null>(null);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Restore the persisted size on mount.
  useEffect(() => {
    const restore = () => {
      try {
        const saved = localStorage.getItem(SIZE_KEY);
        if (saved) {
          const s = JSON.parse(saved);
          if (s?.w && s?.h) setSize({ w: s.w, h: s.h });
        }
      } catch {
        /* ignore */
      }
    };
    restore();
  }, []);

  // Global pointer listeners drive the resize once a handle is grabbed.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const maxW = window.innerWidth - 32;
      const maxH = window.innerHeight - 32;
      let w = d.w;
      let h = d.h;
      if (d.dir === "l" || d.dir === "tl") w = d.w + (d.x - e.clientX); // drag left → grow
      if (d.dir === "t" || d.dir === "tl") h = d.h + (d.y - e.clientY); // drag up → grow
      w = Math.max(MIN_W, Math.min(maxW, w));
      h = Math.max(MIN_H, Math.min(maxH, h));
      setSize({ w, h });
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      try {
        localStorage.setItem(SIZE_KEY, JSON.stringify(sizeRef.current));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const startResize = (e: React.PointerEvent, dir: ResizeDir) => {
    e.preventDefault();
    dragRef.current = { x: e.clientX, y: e.clientY, w: sizeRef.current.w, h: sizeRef.current.h, dir };
    document.body.style.userSelect = "none";
    document.body.style.cursor = dir === "tl" ? "nwse-resize" : dir === "t" ? "ns-resize" : "ew-resize";
  };

  const handleBase: React.CSSProperties = { position: "absolute", zIndex: 5, touchAction: "none" };

  return (
    <>
      <div
        role="dialog"
        aria-label="BizzChat AI Copilot"
        className="bizz-widget glass-panel"
        style={{
          position: "fixed",
          bottom: "calc(1.5rem + 60px + 0.75rem)",
          right: "1.5rem",
          width: `${size.w}px`,
          height: `${size.h}px`,
          maxHeight: "calc(100vh - 2rem)",
          maxWidth: "calc(100vw - 2rem)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          background: "var(--bg-primary)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-lg)",
          zIndex: 1190,
        }}
      >
        {/* Resize handles (panel is anchored bottom-right) */}
        <div
          onPointerDown={(e) => startResize(e, "t")}
          style={{ ...handleBase, top: 0, left: 8, right: 8, height: 6, cursor: "ns-resize" }}
          aria-hidden
        />
        <div
          onPointerDown={(e) => startResize(e, "l")}
          style={{ ...handleBase, top: 8, bottom: 8, left: 0, width: 6, cursor: "ew-resize" }}
          aria-hidden
        />
        <div
          onPointerDown={(e) => startResize(e, "tl")}
          title="Drag to resize"
          aria-label="Resize chat window"
          style={{ ...handleBase, top: 0, left: 0, width: 16, height: 16, cursor: "nwse-resize", zIndex: 6 }}
        >
          <span className="bizz-grip" />
        </div>

        <CopilotHeader variant="desktop" />
        <CopilotChatBody />
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .bizz-widget { animation: bizzWidgetIn 0.22s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: bottom right; }
            @keyframes bizzWidgetIn {
              from { opacity: 0; transform: translateY(16px) scale(0.96); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            .bizz-grip {
              position: absolute; top: 4px; left: 4px; width: 8px; height: 8px;
              border-top: 2px solid var(--text-secondary);
              border-left: 2px solid var(--text-secondary);
              border-top-left-radius: 3px; opacity: 0.45;
              transition: opacity var(--transition-fast);
            }
            .bizz-widget:hover .bizz-grip { opacity: 0.8; }
            @media (prefers-reduced-motion: reduce) {
              .bizz-widget { animation: none; }
            }
          `,
        }}
      />
    </>
  );
}
