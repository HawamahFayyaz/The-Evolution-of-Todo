"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RotateCcw, List, Plus } from "lucide-react";
import type { ChatMessage as ChatMessageType, ChatError as ChatErrorType } from "@/types/chat";
import { createUserMessage, transformApiResponse } from "@/types/chat";
import { sendMessage, getConversationHistory, apiErrorToChatError } from "@/lib/api/chat";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ChatLoading } from "./chat-loading";
import { ChatError } from "./chat-error";
import { ChatEmptyState } from "./chat-empty-state";
import { Button } from "@/components/ui/button";

const CONVERSATION_STORAGE_KEY = "donext_conversation_id";

/**
 * Main chat container component.
 * Manages chat state, message sending, and coordinates child components.
 */
export function ChatContainer() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<ChatErrorType | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    if (savedConversationId) {
      setConversationId(savedConversationId);
      loadConversationHistory(savedConversationId);
    }
  }, []);

  // Load conversation history
  const loadConversationHistory = async (convId: string) => {
    setIsLoadingHistory(true);
    setError(null);

    try {
      const history = await getConversationHistory(convId);
      setMessages(history);
    } catch (err) {
      const chatError = apiErrorToChatError(err);
      // If conversation not found, clear it and start fresh
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

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // Auto-scroll when new messages arrive (if at bottom)
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsAtBottom(atBottom);
    }
  }, []);

  // Send message handler
  const handleSend = async () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage || isLoading) return;

    // Create optimistic user message
    const userMessage = createUserMessage(trimmedMessage);

    // Update UI immediately
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

      // Update conversation ID if new
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        localStorage.setItem(CONVERSATION_STORAGE_KEY, response.conversation_id);
      }

      // Add AI response
      const assistantMessage = transformApiResponse(response);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(apiErrorToChatError(err));
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
      setInputValue(trimmedMessage); // Restore input
    } finally {
      setIsLoading(false);
      // Focus input after send
      inputRef.current?.focus();
    }
  };

  // Handle suggestion click from empty state
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  // Start new conversation
  const handleNewConversation = () => {
    localStorage.removeItem(CONVERSATION_STORAGE_KEY);
    setConversationId(null);
    setMessages([]);
    setError(null);
    setInputValue("");
  };

  // Retry last failed message
  const handleRetry = () => {
    if (inputValue) {
      handleSend();
    }
  };

  // Navigate to traditional task view
  const handleFallback = () => {
    router.push("/dashboard/tasks");
  };

  const showEmptyState = (messages?.length ?? 0) === 0 && !isLoadingHistory && !error;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">DoNext Chat</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewConversation}
            disabled={isLoading}
            title="New conversation"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline ml-1">New</span>
          </Button>
          <Link href="/dashboard/tasks">
            <Button variant="ghost" size="sm" title="Traditional view">
              <List className="h-5 w-5" />
              <span className="hidden sm:inline ml-1">Tasks</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="max-w-4xl mx-auto">
          {/* Loading history skeleton */}
          {isLoadingHistory && (
            <div className="flex justify-center py-8">
              <RotateCcw className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && (
            <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
          )}

          {/* Messages */}
          {(messages ?? []).map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLatest={index === messages.length - 1}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && <ChatLoading />}

          {/* Error display */}
          {error && (
            <ChatError
              error={error}
              onRetry={handleRetry}
              onFallback={handleFallback}
            />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={isLoading}
      />
    </div>
  );
}
