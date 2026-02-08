/**
 * Dashboard layout with sidebar navigation and floating chat.
 * Protected - requires authentication.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FloatingChat } from "@/components/chat/floating-chat";
import { CommandPaletteWrapper } from "@/components/command-palette-wrapper";
import { RemindersProvider } from "@/components/reminders-provider";

async function getSessionWithRetry(maxRetries = 2) {
  const reqHeaders = await headers();
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await auth.api.getSession({ headers: reqHeaders });
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.message.includes("ETIMEDOUT") ||
          error.message.includes("timeout") ||
          error.message.includes("ECONNREFUSED"));
      if (isTimeout && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      console.error(`Session fetch failed (attempt ${attempt + 1}):`, error);
      return null;
    }
  }
  return null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionWithRetry();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors">
      {/* Desktop sidebar */}
      <Sidebar user={session.user} />

      {/* Main content area */}
      <div className="lg:pl-[260px] min-h-screen flex flex-col transition-all duration-300">
        <Header user={session.user} />
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Floating chat - accessible from every dashboard page */}
      <FloatingChat />

      {/* Command palette - accessible via Cmd+K */}
      <CommandPaletteWrapper />

      {/* Browser notification reminders */}
      <RemindersProvider />
    </div>
  );
}
