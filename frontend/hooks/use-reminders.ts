"use client";

import { useEffect, useRef } from "react";
import { useTasks } from "@/hooks/use-tasks";

const POLL_INTERVAL = 60_000; // 1 minute
const REMINDER_WINDOW = 15 * 60_000; // 15 minutes before due

/**
 * Hook that polls tasks and sends browser notifications
 * for tasks due within 15 minutes.
 */
export function useReminders() {
  const { tasks } = useTasks();
  const notifiedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    function checkReminders() {
      if (Notification.permission !== "granted") return;

      const now = Date.now();
      tasks.forEach((task) => {
        if (task.completed || !task.dueDate) return;
        if (notifiedRef.current.has(task.id)) return;

        const dueTime = new Date(task.dueDate).getTime();
        const timeUntilDue = dueTime - now;

        // Notify if due within 15 minutes and not past
        if (timeUntilDue > 0 && timeUntilDue <= REMINDER_WINDOW) {
          const minutes = Math.ceil(timeUntilDue / 60_000);
          new Notification("DoNext Reminder", {
            body: `"${task.title}" is due in ${minutes} minute${minutes === 1 ? "" : "s"}`,
            icon: "/favicon.ico",
            tag: `task-${task.id}`,
          });
          notifiedRef.current.add(task.id);
        }
      });
    }

    checkReminders();
    const interval = setInterval(checkReminders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [tasks]);
}

/**
 * Request notification permission on mount.
 */
export function useNotificationPermission() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);
}
