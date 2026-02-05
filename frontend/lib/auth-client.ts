/**
 * Better Auth client configuration.
 *
 * This file provides client-side authentication hooks and utilities.
 * Use these in Client Components for authentication state and actions.
 */

"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth client instance.
 *
 * Provides hooks for:
 * - useSession: Get current user session
 * - signIn: Email/password sign-in
 * - signUp: Email/password registration
 * - signOut: End user session
 *
 * Example usage:
 * ```tsx
 * "use client";
 * import { authClient } from "@/lib/auth-client";
 *
 * export function LoginButton() {
 *   const { data: session } = authClient.useSession();
 *
 *   if (session) {
 *     return <button onClick={() => authClient.signOut()}>Sign Out</button>;
 *   }
 *
 *   return <button onClick={() => authClient.signIn.email({ ... })}>Sign In</button>;
 * }
 * ```
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

/**
 * Convenience exports for common auth operations.
 */
export const { useSession, signIn, signUp, signOut } = authClient;

/**
 * Get the current session token for API calls.
 *
 * The session token is verified by the backend via database lookup.
 *
 * Returns null if no active session.
 *
 * Example:
 * ```ts
 * const token = await getSessionToken();
 * if (token) {
 *   fetch("/api/tasks", {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 * }
 * ```
 */
export async function getSessionToken(): Promise<string | null> {
  try {
    const session = await authClient.getSession();

    if (!session.data?.session) {
      return null;
    }

    // Return the session token - backend verifies it via database lookup
    return session.data.session.token;
  } catch (error) {
    console.error("[Auth] Error getting session token:", error);
    return null;
  }
}

/**
 * Clear all cached user data from browser storage.
 *
 * SECURITY: This function MUST be called on logout to prevent
 * data leakage between users.
 *
 * Clears:
 * - localStorage keys containing task data
 * - sessionStorage keys containing task data
 * - Any other user-specific cached data
 */
export function clearUserDataCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Clear localStorage task-related data
  const localStorageKeysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("task") ||
        key.includes("tasks") ||
        key.includes("user") ||
        key.includes("cache"))
    ) {
      localStorageKeysToRemove.push(key);
    }
  }
  localStorageKeysToRemove.forEach((key) => localStorage.removeItem(key));

  // Clear sessionStorage task-related data
  const sessionStorageKeysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (
      key &&
      (key.startsWith("task") ||
        key.includes("tasks") ||
        key.includes("user") ||
        key.includes("cache"))
    ) {
      sessionStorageKeysToRemove.push(key);
    }
  }
  sessionStorageKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

/**
 * Sign out the user and clear all cached data.
 *
 * This is the recommended way to sign out users. It ensures
 * all user data is properly cleared to prevent data leakage.
 */
export async function signOutAndClearCache(): Promise<void> {
  // Clear all cached user data first
  clearUserDataCache();

  // Then sign out via Better Auth
  await authClient.signOut();
}
