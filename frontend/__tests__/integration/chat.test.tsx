import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/chat", () => ({
  sendMessage: vi.fn(),
  getConversationHistory: vi.fn(),
  apiErrorToChatError: vi.fn(() => ({
    type: "server",
    message: "Something went wrong on our end. Please try again.",
    retryable: true,
  })),
}));

import { ChatContainer } from "@/components/chat/chat-container";
import { sendMessage, getConversationHistory } from "@/lib/api/chat";

const mockSendMessage = vi.mocked(sendMessage);
const mockGetHistory = vi.mocked(getConversationHistory);

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
});

describe("Chat Integration Flow", () => {
  it("complete conversation flow: send message and receive AI response", async () => {
    mockSendMessage.mockResolvedValueOnce({
      conversation_id: "conv-1",
      response: "Hello! How can I help?",
    });

    render(<ChatContainer />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(
      "Ask me anything about your tasks..."
    );
    await user.type(input, "Hello");
    await user.click(screen.getByLabelText("Send message"));

    // User message appears optimistically
    expect(screen.getByText("Hello")).toBeInTheDocument();

    // AI response appears after API call
    await waitFor(() => {
      expect(screen.getByText("Hello! How can I help?")).toBeInTheDocument();
    });
  });

  it("displays tool call badges in AI response", async () => {
    mockSendMessage.mockResolvedValueOnce({
      conversation_id: "conv-1",
      response: "Task added successfully!",
      tool_calls: [
        {
          tool: "add_task",
          args: { title: "Buy milk" },
          result: { success: true },
        },
      ],
    });

    render(<ChatContainer />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(
      "Ask me anything about your tasks..."
    );
    await user.type(input, "Add task: Buy milk");
    await user.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(screen.getByText("Task added successfully!")).toBeInTheDocument();
      expect(screen.getByText("Added task")).toBeInTheDocument();
    });
  });

  it("handles API error and restores input", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("Network error"));

    render(<ChatContainer />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(
      "Ask me anything about your tasks..."
    );
    await user.type(input, "Hello");
    await user.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong on our end. Please try again.")
      ).toBeInTheDocument();
    });

    // Input should be restored with original text
    expect(input).toHaveValue("Hello");
  });

  it("handles 404 conversation not found gracefully", async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("deleted-conv");

    const { apiErrorToChatError } = await import("@/lib/api/chat");
    vi.mocked(apiErrorToChatError).mockReturnValueOnce({
      type: "not_found",
      message: "Conversation not found",
      retryable: false,
    });

    mockGetHistory.mockRejectedValueOnce(new Error("404"));

    render(<ChatContainer />);

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        "donext_conversation_id"
      );
    });
  });

  it("renders empty state with suggestion buttons", () => {
    render(<ChatContainer />);
    expect(screen.getByText("Show my tasks")).toBeInTheDocument();
    expect(screen.getByText("Add a task: buy groceries")).toBeInTheDocument();
  });
});
