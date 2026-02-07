/**
 * Dashboard navigation component - DoNext Premium.
 *
 * Displays logo, navigation links, user info, and sign out button.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { signOutAndClearCache } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface DashboardNavProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      // Clear all cached user data and sign out
      await signOutAndClearCache();
      toast.success("Signed out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/tasks", label: "Tasks" },
    { href: "/dashboard/chat", label: "Chat AI" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Left: Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Logo size={40} showText href="/dashboard" />

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: User info and Sign out */}
          <div className="flex items-center gap-4">
            {/* User Avatar and Name */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user.name || user.email}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={loading}
              className="text-gray-600"
            >
              {loading ? "..." : "Sign out"}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
