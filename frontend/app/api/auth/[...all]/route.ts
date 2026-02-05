/**
 * Better Auth API route handler.
 *
 * This catch-all route handles all Better Auth API endpoints:
 * - POST /api/auth/sign-up - User registration
 * - POST /api/auth/sign-in/email - Email/password login
 * - POST /api/auth/sign-out - Session termination
 * - GET /api/auth/session - Get current session
 *
 * These endpoints are automatically handled by Better Auth.
 */

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
