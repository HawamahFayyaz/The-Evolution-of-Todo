"use client";

import { memo } from "react";
import type { ChatMessageProps } from "@/types/chat";
import { hasToolCalls } from "@/types/chat";
import { ToolCallBadge } from "./tool-call-badge";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

export const ChatMessage = memo(function ChatMessage({
  message,
  isLatest,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const showToolCalls = hasToolCalls(message);

  return (
    <div
      role="article"
      aria-label={`${isUser ? "Your" : "Assistant"} message`}
      className={cn(
        "flex gap-2.5 mb-4",
        isUser ? "flex-row-reverse" : "flex-row",
        isLatest && "animate-fade-in"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-slate-200 text-slate-600"
        )}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 shadow-sm",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-md"
            : "bg-white text-slate-800 border border-slate-200 rounded-tl-md"
        )}
      >
        <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          {message.content}
        </p>

        {showToolCalls && message.toolCalls && (
          <div
            className={cn(
              "flex flex-wrap gap-1 mt-2 pt-2 border-t",
              isUser ? "border-indigo-500/30" : "border-slate-100"
            )}
          >
            {message.toolCalls.map((tc, index) => (
              <ToolCallBadge key={`${tc.tool}-${index}`} toolCall={tc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
