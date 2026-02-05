/**
 * Landing page component - DoNext Premium.
 *
 * Public home page with premium hero, features, and sign-in/sign-up options.
 * Authenticated users are redirected to dashboard.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default async function HomePage() {
  // Check if user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect authenticated users to dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header - Fixed with glassmorphism */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-sm">
        <nav className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <Logo size={40} showText href="/" />

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">
                Get started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section - Premium */}
      <main id="main-content" className="pt-20">
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          {/* Animated Badge */}
          <div className="mb-8">
            <span className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg animate-float">
              🎯 SMART TODO MANAGEMENT
            </span>
          </div>

          {/* Hero Heading with Gradient Text */}
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Do What Matters,{" "}
            <span className="gradient-text">Next</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            AI-powered task management that adapts to your workflow.
            Stay organized, focused, and productive.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup">
              <Button variant="gradient" size="lg">
                Start for free
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">
                Watch demo →
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              emoji="💬"
              title="AI Chat"
              description="Natural language task management. Just tell DoNext what you need to do."
            />
            <FeatureCard
              emoji="📊"
              title="Analytics"
              description="Track your productivity and progress with beautiful insights."
            />
            <FeatureCard
              emoji="🔔"
              title="Smart Reminders"
              description="Never miss important deadlines with intelligent notifications."
            />
          </div>
        </section>

        {/* Social Proof / Stats Section */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600 mt-1">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">1M+</div>
              <div className="text-sm text-gray-600 mt-1">Tasks Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">4.9★</div>
              <div className="text-sm text-gray-600 mt-1">User Rating</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="#" className="hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-gray-900 transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 DoNext. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Premium Feature Card Component
 */
function FeatureCard({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-2 transition-all duration-300">
      <div className="text-4xl mb-4">{emoji}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
