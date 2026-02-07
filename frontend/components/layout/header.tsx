"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  LogOut,
  Sparkles,
  Command,
} from "lucide-react";
import { signOutAndClearCache } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: { id: string; name: string; email: string };
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const pageTitle = (() => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname.startsWith("/dashboard/tasks")) return "Tasks";
    if (pathname.startsWith("/dashboard/analytics")) return "Analytics";
    if (pathname.startsWith("/dashboard/chat")) return "Chat";
    return "Dashboard";
  })();

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutAndClearCache();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="flex items-center justify-between h-full px-4 lg:px-8">
          {/* Left: mobile hamburger + page title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{pageTitle}</h1>
          </div>

          {/* Right: Cmd+K hint + user avatar (desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-muted)] bg-[var(--surface-secondary)] border border-[var(--border)] rounded-lg hover:border-[var(--border-hover)] transition-colors"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="text-xs">K</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {user.name || user.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 animate-slide-in-right flex flex-col"
               style={{ animationName: 'none', transform: 'translateX(0)' }}>
            {/* Mobile header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">DoNext</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-600/20 text-white"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5",
                        active ? "text-indigo-400" : "text-slate-500"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User + Sign out */}
            <div className="px-3 py-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>{signingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
