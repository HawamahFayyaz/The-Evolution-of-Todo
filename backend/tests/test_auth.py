"""Tests for session-based authentication module."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from auth import AuthenticationError, verify_session_token
from tests.conftest import auth_header, create_jwt_token, insert_test_session


class TestVerifySessionToken:
    """Tests for verify_session_token function."""

    def test_valid_session_verification(
        self, test_user_id: str, session: Session
    ) -> None:
        """T036: Test valid session token verification."""
        token = create_jwt_token(test_user_id, db_session=session)
        user_id = verify_session_token(token, session)
        assert user_id == test_user_id

    def test_invalid_token_rejection(
        self, test_user_id: str, session: Session
    ) -> None:
        """T037: Test invalid session token rejection (token not in DB)."""
        token = "invalid-token-not-in-database"

        with pytest.raises(AuthenticationError) as exc_info:
            verify_session_token(token, session)

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "INVALID_SESSION"

    def test_expired_session_rejection(
        self, test_user_id: str, session: Session
    ) -> None:
        """T038: Test expired session token rejection."""
        token = create_jwt_token(test_user_id, db_session=session, expired=True)

        with pytest.raises(AuthenticationError) as exc_info:
            verify_session_token(token, session)

        assert exc_info.value.status_code == 401
        assert exc_info.value.detail["code"] == "EXPIRED_SESSION"


class TestAuthEndpoints:
    """Tests for authentication via API endpoints."""

    def test_missing_authorization_header_returns_401(
        self, client: TestClient
    ) -> None:
        """T039: Test missing Authorization header returns 401."""
        # Tasks endpoint requires auth
        response = client.get("/api/tasks")
        assert response.status_code == 401

    def test_valid_token_allows_access(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Test that valid session token allows access to protected endpoints."""
        response = client.get("/api/tasks", headers=auth_header(valid_token))
        assert response.status_code == 200

    def test_invalid_token_returns_401(
        self, client: TestClient, invalid_token: str
    ) -> None:
        """Test that invalid token is rejected."""
        response = client.get("/api/tasks", headers=auth_header(invalid_token))
        assert response.status_code == 401

    def test_expired_token_returns_401(
        self, client: TestClient, expired_token: str
    ) -> None:
        """Test that expired token is rejected."""
        response = client.get("/api/tasks", headers=auth_header(expired_token))
        assert response.status_code == 401


class TestUserIsolation:
    """Tests for user data isolation via session tokens."""

    def test_different_users_get_different_ids(
        self, test_user_id: str, other_user_id: str, session: Session
    ) -> None:
        """Test that different tokens yield different user IDs."""
        token1 = create_jwt_token(test_user_id, db_session=session)
        token2 = create_jwt_token(other_user_id, db_session=session)

        user_id1 = verify_session_token(token1, session)
        user_id2 = verify_session_token(token2, session)

        assert user_id1 == test_user_id
        assert user_id2 == other_user_id
        assert user_id1 != user_id2
