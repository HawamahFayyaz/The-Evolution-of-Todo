/**
 * Landing page component - DoNext Premium.
 *
 * Public home page with premium dark theme, animations, and sign-in/sign-up options.
 * Authenticated users are redirected to dashboard.
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/landing/landing-content";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
