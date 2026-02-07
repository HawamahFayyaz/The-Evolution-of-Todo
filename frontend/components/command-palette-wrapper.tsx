"use client";

import { useEffect } from "react";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { useKeyboardNav } from "@/hooks/use-keyboard-nav";
import { exportTasksCSV } from "@/lib/export-csv";
import { listTasks } from "@/lib/api/tasks";
import { toast } from "sonner";

export function CommandPaletteWrapper() {
  useKeyboardNav();

  useEffect(() => {
    async function handleExport() {
      try {
        const { tasks } = await listTasks();
        exportTasksCSV(tasks);
        toast.success("Tasks exported successfully");
      } catch {
        toast.error("Failed to export tasks");
      }
    }

    window.addEventListener("donext:export-tasks", handleExport);
    return () => window.removeEventListener("donext:export-tasks", handleExport);
  }, []);

  return (
    <>
      <CommandPalette />
      <KeyboardShortcuts />
    </>
  );
}
