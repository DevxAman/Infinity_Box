import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/components/auth/AuthForm";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <AuthShell>
      <AuthForm
        mode="login"
        next={safeNext(next)}
        initialError={error === "auth" ? "That sign-in link is invalid or has expired. Please try again." : undefined}
      />
    </AuthShell>
  );
}
