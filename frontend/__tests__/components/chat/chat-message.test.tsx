import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChatMessage } from "@/components/chat/chat-message";
import type { ChatMessage as ChatMessageType } from "@/types/chat";

function makeMessage(
  overrides: Partial<ChatMessageType> = {}
): ChatMessageType {
  return {
    id: "msg-1",
    role: "user",
    content: "Hello world",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("ChatMessage", () => {
  it("renders user message content", () => {
    render(<ChatMessage message={makeMessage()} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders assistant message content", () => {
    render(
      <ChatMessage
        message={makeMessage({ role: "assistant", content: "AI response" })}
      />
    );
    expect(screen.getByText("AI response")).toBeInTheDocument();
  });

  it("displays tool call badges for assistant messages", () => {
    const message = makeMessage({
      role: "assistant",
      content: "Done!",
      toolCalls: [
        { tool: "add_task", args: { title: "Test" }, result: { success: true } },
      ],
    });
    render(<ChatMessage message={message} />);
    expect(screen.getByText("Added task")).toBeInTheDocument();
  });

  it("does not show tool badges for user messages", () => {
    const message = makeMessage({
      role: "user",
      content: "Hi",
      toolCalls: [
        { tool: "add_task", args: {}, result: { success: true } },
      ],
    });
    render(<ChatMessage message={message} />);
    expect(screen.queryByText("Added task")).not.toBeInTheDocument();
  });

  it("shows multiple tool call badges", () => {
    const message = makeMessage({
      role: "assistant",
      content: "Done!",
      toolCalls: [
        { tool: "add_task", args: {}, result: { success: true } },
        { tool: "list_tasks", args: {}, result: { success: true } },
      ],
    });
    render(<ChatMessage message={message} />);
    expect(screen.getByText("Added task")).toBeInTheDocument();
    expect(screen.getByText("Listed tasks")).toBeInTheDocument();
  });

  it("handles message with no tool calls", () => {
    const message = makeMessage({
      role: "assistant",
      content: "Just text",
    });
    render(<ChatMessage message={message} />);
    expect(screen.getByText("Just text")).toBeInTheDocument();
  });

  it("renders content with whitespace-pre-wrap class", () => {
    const message = makeMessage({ content: "Line 1\nLine 2" });
    const { container } = render(<ChatMessage message={message} />);
    const paragraph = container.querySelector("p");
    expect(paragraph).toHaveClass("whitespace-pre-wrap");
    expect(paragraph?.textContent).toBe("Line 1\nLine 2");
  });
});
