"use client";

import { AlertTriangle, RotateCcw, List } from "lucide-react";
import type { ChatErrorProps } from "@/types/chat";
import { isRetryableError } from "@/types/chat";

export function ChatError({ error, onRetry, onFallback }: ChatErrorProps) {
  const canRetry = isRetryableError(error);

  return (
    <div className="flex justify-center my-4 animate-fade-in">
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 max-w-[320px]">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[13px] text-red-700 leading-relaxed">{error.message}</p>
            <div className="flex gap-2 mt-2.5">
              {canRetry && onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-white border border-red-200 rounded-lg text-red-700 hover:bg-red-50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              )}
              {onFallback && (
                <button
                  onClick={onFallback}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <List className="w-3 h-3" />
                  Tasks view
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
