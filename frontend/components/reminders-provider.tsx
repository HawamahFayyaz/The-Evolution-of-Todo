"use client";

import { useReminders, useNotificationPermission } from "@/hooks/use-reminders";

export function RemindersProvider() {
  useNotificationPermission();
  useReminders();
  return null;
}
