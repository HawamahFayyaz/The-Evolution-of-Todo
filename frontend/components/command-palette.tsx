"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Plus,
  MessageSquare,
  BarChart3,
  Sun,
  Moon,
  Download,
  Command,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface CommandItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      action: () => { router.push("/dashboard"); setOpen(false); },
      category: "Navigation",
    },
    {
      id: "tasks",
      label: "Go to Tasks",
      icon: CheckSquare,
      shortcut: "T",
      action: () => { router.push("/dashboard/tasks"); setOpen(false); },
      category: "Navigation",
    },
    {
      id: "analytics",
      label: "Go to Analytics",
      icon: BarChart3,
      action: () => { router.push("/dashboard/analytics"); setOpen(false); },
      category: "Navigation",
    },
    {
      id: "new-task",
      label: "Create New Task",
      icon: Plus,
      shortcut: "N",
      action: () => { router.push("/dashboard/tasks?action=new"); setOpen(false); },
      category: "Actions",
    },
    {
      id: "chat",
      label: "Open Chat Assistant",
      icon: MessageSquare,
      action: () => {
        document.querySelector<HTMLButtonElement>("[data-chat-toggle]")?.click();
        setOpen(false);
      },
      category: "Actions",
    },
    {
      id: "export",
      label: "Export Tasks as CSV",
      icon: Download,
      action: () => {
        window.dispatchEvent(new CustomEvent("donext:export-tasks"));
        setOpen(false);
      },
      category: "Actions",
    },
    {
      id: "toggle-theme",
      label: resolvedTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      icon: resolvedTheme === "dark" ? Sun : Moon,
      action: () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
        setOpen(false);
      },
      category: "Preferences",
    },
  ];

  const filtered = query
    ? commands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedIndex(0);
  }

  function handleItemKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  }

  if (!open) return null;

  const categories = [...new Set(filtered.map((c) => c.category))];

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleItemKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--surface-secondary)] border border-[var(--border)] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              No results found
            </p>
          ) : (
            categories.map((category) => (
              <div key={category}>
                <p className="px-4 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {category}
                </p>
                {filtered
                  .filter((c) => c.category === category)
                  .map((item) => {
                    const globalIdx = filtered.indexOf(item);
                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors",
                          globalIdx === selectedIndex
                            ? "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400"
                            : "text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                        )}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-[var(--text-muted)]">
                            {item.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-[10px]">&uarr;&darr;</kbd>
            Navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded text-[10px]">&crarr;</kbd>
            Select
          </span>
          <span className="inline-flex items-center gap-1">
            <Command className="w-3 h-3" />K to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
