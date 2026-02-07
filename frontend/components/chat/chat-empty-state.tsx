"use client";

import { Sparkles } from "lucide-react";

interface ChatEmptyStateProps {
  onSuggestionClick?: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Add a task: buy groceries",
  "Show my tasks",
  "What's pending?",
  "Complete my first task",
];

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-base font-semibold text-slate-900 mb-1">
        Hi! I&apos;m your task assistant
      </h2>
      <p className="text-sm text-slate-500 max-w-[280px] mb-5">
        I can help you manage your tasks using natural language.
      </p>

      <div className="w-full max-w-[300px] space-y-2">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Try saying
        </p>
        <div className="flex flex-col gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick?.(suggestion)}
              className="text-left px-3 py-2 text-[13px] bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
