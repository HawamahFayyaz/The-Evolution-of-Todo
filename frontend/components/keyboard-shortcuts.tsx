"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Open command palette", category: "General" },
  { keys: ["Ctrl", "B"], description: "Toggle sidebar", category: "General" },
  { keys: ["?"], description: "Show keyboard shortcuts", category: "General" },
  { keys: ["Esc"], description: "Close dialog / modal", category: "General" },
  { keys: ["N"], description: "New task", category: "Tasks" },
  { keys: ["T"], description: "Go to tasks", category: "Navigation" },
  { keys: ["D"], description: "Go to dashboard", category: "Navigation" },
  { keys: ["A"], description: "Go to analytics", category: "Navigation" },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!open) return null;

  const categories = [...new Set(SHORTCUTS.map((s) => s.category))];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md mx-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-500" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
          {categories.map((category) => (
            <div key={category}>
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {category}
              </p>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.category === category).map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                  >
                    <span className="text-sm text-[var(--text-secondary)]">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 text-[11px] font-medium bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md text-[var(--text-muted)]"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[var(--border)] text-center">
          <p className="text-[11px] text-[var(--text-muted)]">
            Press <kbd className="px-1.5 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-[10px]">?</kbd> to toggle
          </p>
        </div>
      </div>
    </div>
  );
}
