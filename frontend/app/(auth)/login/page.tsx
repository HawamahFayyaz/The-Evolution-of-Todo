/**
 * Login page component - DoNext Premium.
 *
 * Provides email/password authentication form.
 * Redirects to dashboard on successful login.
 */

import { LoginForm } from "./login-form";
import Link from "next/link";

export const metadata = {
  title: "Sign In - DoNext",
  description: "Sign in to your DoNext account",
};

export default function LoginPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="mt-2 text-gray-600">Sign in to continue to DoNext</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
        >
          Sign up for free
        </Link>
      </p>
    </>
  );
}
