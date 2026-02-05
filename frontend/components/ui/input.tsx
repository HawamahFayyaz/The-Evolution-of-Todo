"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Reusable input component with label and error support.
 *
 * @example
 * <Input label="Email" type="email" error="Invalid email" />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const baseStyles =
      "w-full px-3 py-2 border rounded-lg shadow-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:border-transparent";

    const normalStyles =
      "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500";

    const errorStyles =
      "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500";

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
