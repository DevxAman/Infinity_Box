import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

/** The signed-in user, verified with Supabase, or null. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Use on protected pages: sends guests to /login and back afterwards. */
export async function requireUser(returnTo: string) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export function displayName(user: User) {
  return (user.user_metadata.full_name as string | undefined) ?? (user.user_metadata.name as string | undefined) ?? user.email ?? "Guest";
}

/** Mirror the Supabase user into our own `profiles` table (first booking). */
export async function ensureProfile(user: User) {
  await db.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email ?? "",
      fullName: displayName(user),
      avatarUrl: (user.user_metadata.avatar_url as string | undefined) ?? null,
    },
    update: {},
  });
}
