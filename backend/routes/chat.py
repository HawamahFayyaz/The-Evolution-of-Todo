"""Chat API routes for AI-powered task management.

Provides endpoints for sending chat messages and retrieving conversation history.
All endpoints require JWT authentication and enforce data isolation.
"""

import json
import logging
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from auth import get_current_user
from database import get_session
from models import Conversation, Message
from rate_limiter import limiter, RATE_LIMITS
from agent import create_tools_for_user, create_agent, run_agent, AIServiceError

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


# --- Pydantic Request/Response Models ---

class ChatRequest(BaseModel):
    """Request model for sending a chat message."""
    conversation_id: int | None = Field(default=None)
    message: str = Field(min_length=1, max_length=2000)


class ToolCallResponse(BaseModel):
    """Represents a single tool call made by the AI agent."""
    tool: str
    args: dict
    result: dict


class ChatResponse(BaseModel):
    """Response model for a chat message."""
    conversation_id: int
    response: str
    tool_calls: list[ToolCallResponse] | None = None


class MessageResponse(BaseModel):
    """Response model for a message in conversation history."""
    id: int
    role: str
    content: str
    tool_calls: list[ToolCallResponse] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Helper Functions ---

def create_conversation(user_id: str, session: Session) -> Conversation:
    """Create a new conversation for the user.

    Args:
        user_id: Authenticated user's ID.
        session: Database session.

    Returns:
        Conversation: The newly created conversation.
    """
    conversation = Conversation(user_id=user_id)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation


def get_conversation(
    conversation_id: int, user_id: str, session: Session
) -> Conversation | None:
    """Get a conversation by ID, ensuring ownership.

    Args:
        conversation_id: Conversation ID to look up.
        user_id: Authenticated user's ID.
        session: Database session.

    Returns:
        Conversation or None if not found or not owned.
    """
    return session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
            Conversation.deleted_at.is_(None),
        )
    ).first()


def save_message(
    conversation_id: int,
    user_id: str,
    role: str,
    content: str,
    session: Session,
    tool_calls: list[dict] | None = None,
) -> Message:
    """Save a message to the database.

    Args:
        conversation_id: Conversation this message belongs to.
        user_id: Message owner's ID.
        role: Message role ('user' or 'assistant').
        content: Message text content.
        session: Database session.
        tool_calls: Optional list of tool call dicts to serialize.

    Returns:
        Message: The saved message.
    """
    message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
        tool_calls_json=json.dumps(tool_calls) if tool_calls else None,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def load_messages(
    conversation_id: int, session: Session, limit: int = 50
) -> list[Message]:
    """Load messages for a conversation, ordered by creation time.

    Args:
        conversation_id: Conversation to load messages for.
        session: Database session.
        limit: Maximum number of messages to return.

    Returns:
        list[Message]: Messages ordered by created_at ASC.
    """
    return list(
        session.exec(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        ).all()
    )


def _messages_to_history(messages: list[Message]) -> list[dict]:
    """Convert Message objects to the format expected by the agent.

    Args:
        messages: List of Message objects.

    Returns:
        list[dict]: List of {"role": str, "content": str} dicts.
    """
    return [{"role": m.role, "content": m.content} for m in messages]


def _parse_tool_calls_json(tool_calls_json: str | None) -> list[ToolCallResponse] | None:
    """Parse tool_calls_json string into ToolCallResponse list.

    Args:
        tool_calls_json: JSON string or None.

    Returns:
        list[ToolCallResponse] or None.
    """
    if not tool_calls_json:
        return None
    try:
        data = json.loads(tool_calls_json)
        return [ToolCallResponse(**tc) for tc in data]
    except (json.JSONDecodeError, TypeError, KeyError):
        return None


# --- Endpoints ---

@router.post("/api/chat", response_model=ChatResponse)
@limiter.limit(RATE_LIMITS["chat_send"])
async def send_chat_message(
    request: Request,
    chat_request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
) -> ChatResponse:
    """Send a chat message and get an AI response.

    Full stateless flow:
    1. Authenticate user
    2. Get or create conversation
    3. Save user message
    4. Load conversation history
    5. Create tools + agent for this user
    6. Run agent with history
    7. Save assistant response
    8. Return response with tool calls

    Args:
        request: FastAPI request object.
        chat_request: Chat message request body.
        session: Database session.
        current_user: Authenticated user's ID.

    Returns:
        ChatResponse: AI response with optional tool call information.
    """
    # Strip the message
    message_text = chat_request.message.strip()
    if not message_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"code": "VALIDATION_ERROR", "message": "Message cannot be empty."},
        )

    # Get or create conversation
    if chat_request.conversation_id is not None:
        conversation = get_conversation(
            chat_request.conversation_id, current_user, session
        )
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "CONVERSATION_NOT_FOUND",
                    "message": "Conversation not found.",
                },
            )
    else:
        conversation = create_conversation(current_user, session)

    # Save user message
    save_message(conversation.id, current_user, "user", message_text, session)

    # Load full conversation history (includes the just-saved user message)
    history_messages = load_messages(conversation.id, session)
    history = _messages_to_history(history_messages)

    # Create tools and agent for this user
    try:
        tools = create_tools_for_user(current_user, session)
        agent = create_agent(tools)
        result = await run_agent(agent, history)
    except AIServiceError as e:
        logger.exception("AI service error for user %s", current_user)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "AI_SERVICE_UNAVAILABLE",
                "message": str(e),
            },
        )

    # Save assistant response
    save_message(
        conversation.id,
        current_user,
        "assistant",
        result.response,
        session,
        tool_calls=[
            {"tool": tc["tool"], "args": tc["args"], "result": tc["result"]}
            for tc in result.tool_calls
        ]
        if result.tool_calls
        else None,
    )

    # Update conversation timestamp
    conversation.updated_at = datetime.now(UTC)
    session.add(conversation)
    session.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        response=result.response,
        tool_calls=[
            ToolCallResponse(tool=tc["tool"], args=tc["args"], result=tc["result"])
            for tc in result.tool_calls
        ]
        if result.tool_calls
        else None,
    )


@router.get(
    "/api/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
@limiter.limit(RATE_LIMITS["chat_history"])
async def get_conversation_messages(
    request: Request,
    conversation_id: int,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
    limit: int = Query(default=50, ge=1, le=100),
) -> list[MessageResponse]:
    """Get message history for a conversation.

    Args:
        request: FastAPI request object.
        conversation_id: Conversation ID to retrieve messages for.
        session: Database session.
        current_user: Authenticated user's ID.
        limit: Maximum number of messages (1-100, default 50).

    Returns:
        list[MessageResponse]: Messages ordered by creation time.
    """
    # Verify conversation ownership (return 404 to prevent enumeration)
    conversation = get_conversation(conversation_id, current_user, session)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CONVERSATION_NOT_FOUND",
                "message": "Conversation not found.",
            },
        )

    messages = load_messages(conversation_id, session, limit=limit)

    return [
        MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            tool_calls=_parse_tool_calls_json(msg.tool_calls_json),
            created_at=msg.created_at,
        )
        for msg in messages
    ]
