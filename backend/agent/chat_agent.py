"""Chat agent setup using OpenAI Agents SDK.

Creates and runs an AI agent that can manage tasks via function tools.
"""

import asyncio
import logging
from dataclasses import dataclass

from agents import Agent, Runner
from agents.items import ToolCallItem, ToolCallOutputItem

from config import get_settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are TodoAssistant, a friendly and helpful AI assistant for task management.

You can help users manage their todo tasks using the following tools:

1. **add_task** - Create a new task. Ask for a title at minimum.
2. **list_tasks** - Show the user's tasks. Can filter by status (all/pending/completed).
3. **complete_task** - Mark a task as done by its ID.
4. **delete_task** - Remove a task by its ID.
5. **update_task** - Change a task's title, description, or due date.

## Guidelines

- Be concise and friendly in your responses.
- When a user asks to "add", "create", or "make" a task, use add_task.
- When a user asks to "show", "list", or "what are my" tasks, use list_tasks.
- When a user says "done", "complete", or "finish" a task, use complete_task.
- When a user says "remove", "delete", or "get rid of" a task, use delete_task.
- When a user says "change", "update", "rename", or "edit" a task, use update_task.
- If the user's intent is ambiguous, ask for clarification.
- After performing an action, confirm what you did in a natural way.
- When listing tasks, format them clearly with IDs so users can reference them.
- If a tool returns an error, explain it helpfully to the user.
"""


class AIServiceError(Exception):
    """Raised when the AI service is unavailable or times out."""
    pass


@dataclass
class AgentResult:
    """Result from running the chat agent."""
    response: str
    tool_calls: list[dict] | None


def create_agent(tools: list, model: str | None = None) -> Agent:
    """Create a TodoAssistant agent with the given tools.

    Args:
        tools: List of FunctionTool instances from create_tools_for_user().
        model: OpenAI model name. Defaults to config setting.

    Returns:
        Agent: Configured agent ready for Runner.run().
    """
    if model is None:
        model = get_settings().openai_model

    return Agent(
        name="TodoAssistant",
        instructions=SYSTEM_PROMPT,
        tools=tools,
        model=model,
    )


async def run_agent(agent: Agent, messages: list[dict], timeout: int = 30) -> AgentResult:
    """Run the agent with conversation history and return the result.

    Args:
        agent: The configured Agent instance.
        messages: Conversation history as list of {"role": str, "content": str} dicts.
        timeout: Maximum seconds to wait for AI response.

    Returns:
        AgentResult: The agent's response and any tool calls made.

    Raises:
        AIServiceError: If the AI service times out or is unavailable.
    """
    try:
        # Convert message history to the format expected by Runner
        input_items = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "user":
                input_items.append({"role": "user", "content": content})
            elif role == "assistant":
                input_items.append({"role": "assistant", "content": content})

        # Run the agent asynchronously with timeout
        result = await asyncio.wait_for(
            Runner.run(agent, input=input_items),
            timeout=timeout,
        )

        # Extract response text
        response = str(result.final_output) if result.final_output else ""
        if not response.strip():
            response = "I'm not sure how to help with that. You can ask me to add, list, complete, delete, or update tasks."

        # Extract tool calls from new_items
        tool_calls = _extract_tool_calls(result.new_items)

        return AgentResult(response=response, tool_calls=tool_calls or None)

    except asyncio.TimeoutError:
        logger.exception("AI agent timed out after %d seconds", timeout)
        raise AIServiceError("AI service timed out. Please try again.")
    except AIServiceError:
        raise
    except Exception as e:
        logger.exception("AI agent error: %s", e)
        raise AIServiceError(f"AI service error: {str(e)}")


def _extract_tool_calls(new_items: list) -> list[dict]:
    """Extract tool call information from RunResult.new_items.

    Args:
        new_items: List of RunItem from the agent result.

    Returns:
        list[dict]: List of tool call dicts with tool, args, result keys.
    """
    tool_calls = []
    # Pair tool calls with their outputs
    call_map: dict[str, dict] = {}

    for item in new_items:
        if isinstance(item, ToolCallItem):
            raw = item.raw_item
            call_id = getattr(raw, "call_id", None) or getattr(raw, "id", "")
            call_map[call_id] = {
                "tool": getattr(raw, "name", "unknown"),
                "args": _parse_arguments(getattr(raw, "arguments", "{}")),
                "result": {},
            }
        elif isinstance(item, ToolCallOutputItem):
            raw = item.raw_item
            call_id = getattr(raw, "call_id", "")
            if call_id in call_map:
                call_map[call_id]["result"] = item.output if isinstance(item.output, dict) else {"output": str(item.output)}

    tool_calls = list(call_map.values())
    return tool_calls


def _parse_arguments(arguments: str) -> dict:
    """Parse tool call arguments from JSON string.

    Args:
        arguments: JSON string of arguments.

    Returns:
        dict: Parsed arguments.
    """
    import json
    try:
        return json.loads(arguments)
    except (json.JSONDecodeError, TypeError):
        return {}
