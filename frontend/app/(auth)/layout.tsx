/**
 * Auth pages layout - DoNext Premium.
 *
 * Provides a centered card layout for login and signup pages
 * with the DoNext logo prominently displayed.
 * Redirects authenticated users to dashboard.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is already authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/">
          <Logo size={64} />
        </Link>
      </div>

      {/* Auth Card */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
        {children}
      </div>

      {/* Back to home link */}
      <p className="mt-8 text-sm text-gray-500">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
