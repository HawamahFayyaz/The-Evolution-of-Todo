"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import {
  MessageSquare,
  BarChart3,
  Bell,
  Zap,
  Shield,
  Repeat,
  ListPlus,
  CheckCircle,
  Sparkles,
  Menu,
  X,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

const FEATURES = [
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description: "Manage tasks with natural language. Just say what you need.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Track productivity with beautiful, real-time insights.",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    description: "Browser notifications so you never miss a deadline.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Zap,
    title: "Instant Actions",
    description: "Keyboard shortcuts and quick actions for power users.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description: "End-to-end encryption and zero-trust architecture.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Repeat,
    title: "Recurring Tasks",
    description: "Set daily, weekly, or monthly recurring tasks with ease.",
    gradient: "from-pink-500 to-rose-500",
  },
];

const STEPS = [
  {
    icon: ListPlus,
    step: "01",
    title: "Create Tasks",
    description: "Add tasks manually or use AI chat to create them with natural language.",
  },
  {
    icon: CheckCircle,
    step: "02",
    title: "Stay Organized",
    description: "Sort, filter, tag, and prioritize. Find anything in seconds.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Get Things Done",
    description: "Smart reminders and AI suggestions keep you on track.",
  },
];

export function LandingContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Skip link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[100px] animate-pulse [animation-delay:2s]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[80px] animate-pulse [animation-delay:4s]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <nav className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <Logo size={40} showText href="/" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              How it Works
            </Link>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="gradient" size="sm">
                Get started
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 space-y-3">
              <Link href="#features" className="block text-sm text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                Features
              </Link>
              <Link href="#how-it-works" className="block text-sm text-slate-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                How it Works
              </Link>
              <div className="flex items-center gap-3 pt-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300">Sign in</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="gradient" size="sm">Get started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <main id="main-content" className="pt-20 relative">
        <section className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="mb-8">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                AI-Powered Task Management
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight"
            >
              Do What Matters,{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                Next
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-slate-400 mt-6 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              The AI-powered task manager that adapts to your workflow.
              Create, organize, and conquer — with natural language and smart automation.
            </motion.p>

            {/* CTA */}
            <motion.div variants={fadeUp} custom={3} className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/signup">
                <Button variant="gradient" size="lg" className="text-base px-8 py-3 shadow-lg shadow-indigo-500/25">
                  Start for free
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="lg" className="text-base text-slate-300 hover:text-white">
                  Explore features
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-3 gap-8 mt-20 max-w-lg mx-auto"
          >
            {[
              { value: "10K+", label: "Active Users" },
              { value: "1M+", label: "Tasks Completed" },
              { value: "4.9", label: "User Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                stay productive
              </span>
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              Powerful features wrapped in a beautiful interface. No learning curve required.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold">
              Get started in{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
                className="text-center"
              >
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 mb-4">
                  <step.icon className="w-7 h-7 text-indigo-400" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-[10px] font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-3xl p-10 md:p-16 text-center overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 rounded-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to get things done?
              </h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Join thousands of users who manage their tasks smarter with AI.
                Free to start, no credit card required.
              </p>
              <Link href="/signup">
                <Button variant="gradient" size="lg" className="text-base px-10 py-3 shadow-lg shadow-indigo-500/25">
                  Get started for free
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="#" className="hover:text-slate-300 transition-colors">About</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Contact</Link>
            </div>
            <p className="text-sm text-slate-600">
              &copy; 2026 DoNext. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
