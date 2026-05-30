"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ThemeProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem("kb_theme") || "dark";
      if (savedTheme === "light") {
        document.documentElement.classList.add("light-theme");
      } else {
        document.documentElement.classList.remove("light-theme");
      }
    };

    applyTheme();

    // Listen for changes from other tabs or the settings page
    window.addEventListener("storage", applyTheme);
    // Poll to catch same-tab localStorage changes (e.g. from settings page)
    const interval = setInterval(applyTheme, 500);

    return () => {
      window.removeEventListener("storage", applyTheme);
      clearInterval(interval);
    };
  }, [pathname]);

  return null; // This component renders nothing, it only manages the theme
}
