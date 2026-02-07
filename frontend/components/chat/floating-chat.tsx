"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Minus, Plus, RotateCcw, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType, ChatError as ChatErrorType } from "@/types/chat";
import { createUserMessage, transformApiResponse } from "@/types/chat";
import { sendMessage, getConversationHistory, apiErrorToChatError } from "@/lib/api/chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatLoading } from "./chat-loading";
import { ChatError } from "./chat-error";
import { ChatEmptyState } from "./chat-empty-state";

const CONVERSATION_STORAGE_KEY = "donext_conversation_id";

export function FloatingChat() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<ChatErrorType | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Load conversation on mount
  useEffect(() => {
    const savedId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (savedId) {
      setConversationId(savedId);
    }
  }, []);

  // Load history when opening chat
  useEffect(() => {
    if (isOpen && conversationId && messages.length === 0) {
      loadConversationHistory(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, conversationId]);

  const loadConversationHistory = async (convId: string) => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const history = await getConversationHistory(convId);
      setMessages(history);
    } catch (err) {
      const chatError = apiErrorToChatError(err);
      if (chatError.type === "not_found") {
        localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        setConversationId(null);
      } else {
        setError(chatError);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (isAtBottom && messages.length > 0 && isOpen) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom, isOpen]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
    }
  }, []);

  const handleSend = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage = createUserMessage(trimmedMessage);
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    setIsAtBottom(true);

    try {
      const response = await sendMessage({
        conversation_id: conversationId || undefined,
        message: trimmedMessage,
      });

      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        localStorage.setItem(CONVERSATION_STORAGE_KEY, response.conversation_id);
      }

      const assistantMessage = transformApiResponse(response);
      setMessages((prev) => [...prev, assistantMessage]);

      // Increment unread if minimized
      if (isMinimized || !isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      setError(apiErrorToChatError(err));
      setMessages((prev) => prev.slice(0, -1));
      setInputValue(trimmedMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleNewConversation = () => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setConversationId(null);
    setMessages([]);
    setError(null);
    setInputValue("");
  };

  const handleRetry = () => {
    if (inputValue) handleSend();
  };

  const handleFallback = () => {
    setIsOpen(false);
    router.push("/dashboard/tasks");
  };

  const toggleOpen = () => {
    if (!isOpen) {
      setUnreadCount(0);
      setIsMinimized(false);
    }
    setIsOpen(!isOpen);
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      setUnreadCount(0);
    }
    setIsMinimized(!isMinimized);
  };

  const showEmptyState = messages.length === 0 && !isLoadingHistory && !error;

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-50 chat-window bg-white flex flex-col animate-scale-in",
            // Mobile: full width bottom sheet
            "bottom-0 right-0 left-0 h-[85vh] rounded-t-2xl rounded-b-none",
            // Desktop: floating panel
            "sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px] sm:h-[600px] sm:rounded-2xl",
            isMinimized && "sm:h-auto"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">DoNext AI</h2>
                <p className="text-xs text-indigo-200">Task assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                disabled={isLoading}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={toggleMinimize}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={toggleOpen}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body (hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
                className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50"
              >
                {isLoadingHistory && (
                  <div className="flex justify-center py-8">
                    <RotateCcw className="w-5 h-5 text-slate-400 animate-spin" />
                  </div>
                )}

                {showEmptyState && (
                  <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
                )}

                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatest={index === messages.length - 1}
                  />
                ))}

                {isLoading && <ChatLoading />}

                {error && (
                  <ChatError
                    error={error}
                    onRetry={handleRetry}
                    onFallback={handleFallback}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              {!isAtBottom && messages.length > 3 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
                  <button
                    onClick={() => scrollToBottom()}
                    className="p-2 rounded-full bg-white shadow-lg border border-slate-200 text-slate-500 hover:text-slate-700 transition-all hover:shadow-xl"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Input */}
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={handleSend}
                disabled={isLoading}
              />
            </>
          )}
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center chat-fab"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-scale-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}

          {/* Pulse ring animation */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-indigo-500 opacity-30 animate-ping" />
          )}
        </button>
      )}
    </>
  );
}
