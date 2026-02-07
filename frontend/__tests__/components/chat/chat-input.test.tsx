import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ChatInput } from "@/components/chat/chat-input";

function renderInput(props: Partial<Parameters<typeof ChatInput>[0]> = {}) {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
    onSend: vi.fn(),
    disabled: false,
    ...props,
  };
  return { ...render(<ChatInput {...defaultProps} />), ...defaultProps };
}

describe("ChatInput", () => {
  it("renders textarea with placeholder", () => {
    renderInput();
    expect(
      screen.getByPlaceholderText("Ask me anything about your tasks...")
    ).toBeInTheDocument();
  });

  it("renders custom placeholder", () => {
    renderInput({ placeholder: "Custom placeholder" });
    expect(
      screen.getByPlaceholderText("Custom placeholder")
    ).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const onChange = vi.fn();
    renderInput({ onChange });
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("calls onSend when Enter is pressed with valid input", () => {
    const onSend = vi.fn();
    renderInput({ value: "test message", onSend });
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalled();
  });

  it("does not call onSend when Shift+Enter is pressed", () => {
    const onSend = vi.fn();
    renderInput({ value: "test", onSend });
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend when input is empty", () => {
    const onSend = vi.fn();
    renderInput({ value: "", onSend });
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not call onSend when input is only whitespace", () => {
    const onSend = vi.fn();
    renderInput({ value: "   ", onSend });
    const textarea = screen.getByRole("textbox");
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables textarea when disabled prop is true", () => {
    renderInput({ disabled: true });
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("disables send button when input is empty", () => {
    renderInput({ value: "" });
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("enables send button when input has content", () => {
    renderInput({ value: "hello" });
    expect(screen.getByLabelText("Send message")).not.toBeDisabled();
  });

  it("shows character count near limit", () => {
    const longText = "a".repeat(1850);
    renderInput({ value: longText });
    expect(screen.getByText("1850/2000")).toBeInTheDocument();
  });

  it("does not show character count when well below limit", () => {
    renderInput({ value: "short" });
    expect(screen.queryByText(/\/2000/)).not.toBeInTheDocument();
  });

  it("has proper aria labels", () => {
    renderInput();
    expect(screen.getByLabelText("Message input")).toBeInTheDocument();
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });
});
