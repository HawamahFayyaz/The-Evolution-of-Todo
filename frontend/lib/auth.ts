/**
 * Better Auth server configuration.
 *
 * This file configures Better Auth for server-side authentication.
 * It handles user sessions, JWT token generation, and database integration.
 */

import { betterAuth } from "better-auth";
import { bearer } from "better-auth/plugins";
import { Pool } from "pg";

/**
 * PostgreSQL connection pool for Better Auth.
 * Uses Neon serverless PostgreSQL with SSL required.
 *
 * Neon-specific settings:
 * - connectionTimeoutMillis: 30s to handle cold starts (Neon databases sleep after inactivity)
 * - idleTimeoutMillis: 10s to release idle connections quickly
 * - max: 5 connections (serverless doesn't need many)
 * - ssl: verify-full mode with rejectUnauthorized for proper TLS
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true, // Neon requires SSL, this uses verify-full by default
  connectionTimeoutMillis: 30000, // 30 seconds for cold start wake-up
  idleTimeoutMillis: 10000, // Release idle connections after 10s
  max: 5, // Limit connections for serverless
});

/**
 * Better Auth instance configured for email/password authentication.
 *
 * Features:
 * - Email/password sign-up and sign-in
 * - Bearer tokens for API authentication (JWT signed with HS256)
 * - PostgreSQL session storage via Neon
 *
 * Security Notes:
 * - BETTER_AUTH_SECRET must be at least 32 characters
 * - Never expose BETTER_AUTH_SECRET to the client
 * - All tokens are signed with HS256 algorithm
 */
export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
  plugins: [
    bearer(), // Enables bearer token generation for API authentication
  ],
});

/**
 * Type exports for Better Auth.
 */
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
