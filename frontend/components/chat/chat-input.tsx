"use client";

import { useRef, useEffect, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatInputProps } from "@/types/chat";
import { CHAT_CONSTANTS, isValidInput } from "@/types/chat";

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  maxLength = CHAT_CONSTANTS.MAX_MESSAGE_LENGTH,
  placeholder = "Ask me anything about your tasks...",
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = value.length;
  const isNearLimit = charCount >= CHAT_CONSTANTS.CHAR_WARNING_THRESHOLD;
  const canSend = isValidInput(value, maxLength) && !disabled;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(
        Math.max(textarea.scrollHeight, CHAT_CONSTANTS.INPUT_MIN_HEIGHT),
        CHAT_CONSTANTS.INPUT_MAX_HEIGHT
      );
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 flex-shrink-0">
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5",
              "text-[13px] placeholder:text-slate-400",
              "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400",
              "disabled:bg-slate-50 disabled:cursor-not-allowed",
              "transition-shadow"
            )}
            style={{
              minHeight: `${CHAT_CONSTANTS.INPUT_MIN_HEIGHT}px`,
              maxHeight: `${CHAT_CONSTANTS.INPUT_MAX_HEIGHT}px`,
            }}
            aria-label="Message input"
          />
        </div>
        <button
          onClick={() => canSend && onSend()}
          disabled={!canSend}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
            canSend
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          {disabled ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {isNearLimit && (
        <p
          className={cn(
            "text-[11px] mt-1 text-right",
            charCount >= maxLength ? "text-red-500" : "text-slate-400"
          )}
        >
          {charCount}/{maxLength}
        </p>
      )}
    </div>
  );
}
