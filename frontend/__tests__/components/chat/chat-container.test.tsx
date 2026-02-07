import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/chat", () => ({
  sendMessage: vi.fn(),
  getConversationHistory: vi.fn(),
  apiErrorToChatError: vi.fn(() => ({
    type: "server",
    message: "Something went wrong",
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

describe("ChatContainer", () => {
  it("renders empty state when no messages", () => {
    render(<ChatContainer />);
    expect(screen.getByText(/task assistant/i)).toBeInTheDocument();
  });

  it("renders suggestion buttons in empty state", () => {
    render(<ChatContainer />);
    expect(screen.getByText("Show my tasks")).toBeInTheDocument();
  });

  it("renders chat header with title", () => {
    render(<ChatContainer />);
    expect(screen.getByText("DoNext Chat")).toBeInTheDocument();
  });

  it("renders new conversation button", () => {
    render(<ChatContainer />);
    expect(screen.getByTitle("New conversation")).toBeInTheDocument();
  });

  it("sends message and shows AI response", async () => {
    mockSendMessage.mockResolvedValueOnce({
      conversation_id: "conv-1",
      response: "I added the task!",
      tool_calls: [],
    });

    render(<ChatContainer />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(
      "Ask me anything about your tasks..."
    );
    await user.type(input, "Add a task");
    await user.click(screen.getByLabelText("Send message"));

    expect(screen.getByText("Add a task")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("I added the task!")).toBeInTheDocument();
    });
  });

  it("stores conversation_id in localStorage after first message", async () => {
    mockSendMessage.mockResolvedValueOnce({
      conversation_id: "new-conv-id",
      response: "Hello!",
    });

    render(<ChatContainer />);
    const user = userEvent.setup();

    const input = screen.getByPlaceholderText(
      "Ask me anything about your tasks..."
    );
    await user.type(input, "Hi");
    await user.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        "donext_conversation_id",
        "new-conv-id"
      );
    });
  });

  it("loads conversation history from localStorage on mount", async () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("existing-conv");
    mockGetHistory.mockResolvedValueOnce([
      {
        id: "m1",
        role: "user",
        content: "Previous message",
        createdAt: new Date().toISOString(),
      },
      {
        id: "m2",
        role: "assistant",
        content: "Previous response",
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<ChatContainer />);

    await waitFor(() => {
      expect(screen.getByText("Previous message")).toBeInTheDocument();
      expect(screen.getByText("Previous response")).toBeInTheDocument();
    });
  });

  it("calls localStorage.removeItem on new conversation", async () => {
    render(<ChatContainer />);
    const user = userEvent.setup();
    await user.click(screen.getByTitle("New conversation"));
    expect(localStorage.removeItem).toHaveBeenCalledWith("donext_conversation_id");
  });
});
