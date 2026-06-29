"use client";

// The old "Classic CRM vs AI Assistant" selector is retired: AI is now always
// available via the floating BizzChat launcher, so shop admins go straight to
// the dashboard. This route stays as a redirect for any existing links/bookmarks
// (e.g. the back button on the /ai page).

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WorkspaceRedirect() {
  const router = useRouter();

  useEffect(() => {
    const go = () => {
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!storedUser) {
        router.replace("/auth/login");
        return;
      }
      try {
        const user = JSON.parse(storedUser);
        router.replace(user?.type === "CUSTOMER" ? "/my-khata" : "/dashboard");
      } catch {
        router.replace("/auth/login");
      }
    };
    go();
  }, [router]);

  return null;
}
