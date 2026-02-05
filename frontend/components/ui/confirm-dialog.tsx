/**
 * Confirmation Dialog Component.
 *
 * A reusable modal dialog for confirming destructive actions.
 * Uses a portal to render outside the normal DOM hierarchy.
 */

"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Callback when user confirms the action */
  onConfirm: () => void;
  /** Dialog title */
  title: string;
  /** Dialog message/description */
  message: ReactNode;
  /** Text for the confirm button (default: "Confirm") */
  confirmText?: string;
  /** Text for the cancel button (default: "Cancel") */
  cancelText?: string;
  /** Variant for the confirm button (default: "gradient") */
  confirmVariant?: "gradient" | "secondary" | "ghost";
  /** Whether the confirm action is loading */
  isLoading?: boolean;
  /** Whether this is a destructive action (styles confirm button as red) */
  destructive?: boolean;
}

/**
 * Modal confirmation dialog for confirming user actions.
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showDeleteConfirm}
 *   onClose={() => setShowDeleteConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Task"
 *   message={`Are you sure you want to delete "${task.title}"?`}
 *   confirmText="Delete"
 *   destructive
 * />
 * ```
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "gradient",
  isLoading = false,
  destructive = false,
}: ConfirmDialogProps) {
  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const dialogContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Title */}
        <h2
          id="dialog-title"
          className="text-xl font-semibold text-gray-900 mb-2"
        >
          {title}
        </h2>

        {/* Message */}
        <div id="dialog-description" className="text-gray-600 mb-6">
          {message}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isLoading}
            className={
              destructive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : undefined
            }
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  if (typeof document !== "undefined") {
    return createPortal(dialogContent, document.body);
  }

  return null;
}

export default ConfirmDialog;
