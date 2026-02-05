"""Security logging module for detecting unauthorized access attempts.

Logs suspicious activity such as:
- Cross-user access attempts
- Invalid authentication attempts
- Unusual access patterns

Logs are stored in backend/logs/security_events.log with daily rotation.
"""

import json
import logging
import os
from datetime import datetime, timezone
from logging.handlers import TimedRotatingFileHandler
from typing import Any


class SecurityLogger:
    """Security event logger with structured JSON output."""

    def __init__(self, log_dir: str = "logs"):
        """Initialize security logger with file handler.

        Args:
            log_dir: Directory to store log files.
        """
        # Ensure log directory exists
        os.makedirs(log_dir, exist_ok=True)

        # Create logger
        self.logger = logging.getLogger("security")
        self.logger.setLevel(logging.INFO)

        # Avoid adding duplicate handlers
        if not self.logger.handlers:
            # File handler with daily rotation, keep 30 days
            log_file = os.path.join(log_dir, "security_events.log")
            handler = TimedRotatingFileHandler(
                log_file,
                when="midnight",
                interval=1,
                backupCount=30,  # Keep 30 days of logs
                encoding="utf-8",
            )
            handler.suffix = "%Y-%m-%d"

            # JSON formatter for structured logs
            formatter = logging.Formatter("%(message)s")
            handler.setFormatter(formatter)

            self.logger.addHandler(handler)

    def _create_event(
        self,
        event_type: str,
        user_id: str,
        action: str,
        details: dict[str, Any] | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict[str, Any]:
        """Create a structured security event.

        Args:
            event_type: Type of security event (e.g., 'cross_user_access').
            user_id: ID of the user attempting the action.
            action: Action attempted (e.g., 'read', 'update', 'delete').
            details: Additional event-specific details.
            ip_address: Client IP address.
            user_agent: Client user agent string.

        Returns:
            dict: Structured event data.
        """
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "action": action,
            "ip_address": ip_address or "unknown",
            "user_agent": user_agent or "unknown",
            "details": details or {},
        }

    def log_cross_user_access(
        self,
        attempting_user_id: str,
        resource_type: str,
        resource_id: int,
        actual_owner_id: str,
        action: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Log a cross-user access attempt.

        This is logged when a user tries to access a resource owned by another user.

        Args:
            attempting_user_id: ID of user attempting access.
            resource_type: Type of resource (e.g., 'task').
            resource_id: ID of the resource being accessed.
            actual_owner_id: ID of the actual resource owner.
            action: Action attempted (read, update, delete).
            ip_address: Client IP address.
            user_agent: Client user agent string.
        """
        event = self._create_event(
            event_type="cross_user_access_attempt",
            user_id=attempting_user_id,
            action=action,
            details={
                "resource_type": resource_type,
                "resource_id": resource_id,
                "actual_owner_id": actual_owner_id,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.logger.warning(json.dumps(event))

    def log_unauthorized_access(
        self,
        resource_type: str,
        resource_id: int,
        action: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        reason: str = "invalid_token",
    ) -> None:
        """Log an unauthorized access attempt (no valid authentication).

        Args:
            resource_type: Type of resource (e.g., 'task').
            resource_id: ID of the resource being accessed.
            action: Action attempted.
            ip_address: Client IP address.
            user_agent: Client user agent string.
            reason: Reason for denial (e.g., 'invalid_token', 'expired_session').
        """
        event = self._create_event(
            event_type="unauthorized_access_attempt",
            user_id="anonymous",
            action=action,
            details={
                "resource_type": resource_type,
                "resource_id": resource_id,
                "reason": reason,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.logger.warning(json.dumps(event))

    def log_suspicious_activity(
        self,
        user_id: str,
        activity_type: str,
        description: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """Log suspicious activity patterns.

        Args:
            user_id: ID of user exhibiting suspicious activity.
            activity_type: Type of suspicious activity detected.
            description: Human-readable description.
            ip_address: Client IP address.
            user_agent: Client user agent string.
        """
        event = self._create_event(
            event_type="suspicious_activity",
            user_id=user_id,
            action=activity_type,
            details={
                "description": description,
            },
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.logger.warning(json.dumps(event))


# Global security logger instance
security_logger = SecurityLogger()
