"use client";

import { CheckCircle, XCircle } from "lucide-react";
import type { ToolCallBadgeProps } from "@/types/chat";
import { TOOL_DISPLAY_NAMES } from "@/types/chat";

export function ToolCallBadge({ toolCall }: ToolCallBadgeProps) {
  const displayName = TOOL_DISPLAY_NAMES[toolCall.tool] || toolCall.tool;
  const isSuccess = (toolCall.result as { success?: boolean })?.success !== false;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded-md ${
        isSuccess
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <XCircle className="w-3 h-3" />
      )}
      {displayName}
    </span>
  );
}
