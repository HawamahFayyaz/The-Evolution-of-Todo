/**
 * Signup page component - DoNext Premium.
 *
 * Provides user registration form with email/password.
 * Redirects to dashboard on successful registration.
 */

import { SignupForm } from "./signup-form";
import Link from "next/link";

export const metadata = {
  title: "Sign Up - DoNext",
  description: "Create your DoNext account and start organizing your tasks",
};

export default function SignupPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
        <p className="mt-2 text-gray-600">Start organizing your tasks today</p>
      </div>

      <SignupForm />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
