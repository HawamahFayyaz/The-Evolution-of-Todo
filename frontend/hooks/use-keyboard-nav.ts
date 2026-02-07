"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardNav() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if inside form elements
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "d":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "t":
          e.preventDefault();
          router.push("/dashboard/tasks");
          break;
        case "a":
          e.preventDefault();
          router.push("/dashboard/analytics");
          break;
        case "n":
          e.preventDefault();
          router.push("/dashboard/tasks?action=new");
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
