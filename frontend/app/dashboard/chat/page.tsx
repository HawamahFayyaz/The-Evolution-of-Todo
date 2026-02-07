import { redirect } from "next/navigation";

/**
 * Chat page redirects to dashboard.
 * Chat is now accessible via the floating chat widget on all dashboard pages.
 */
export default function ChatPage() {
  redirect("/dashboard");
}
