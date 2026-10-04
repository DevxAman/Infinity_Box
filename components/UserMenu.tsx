"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/use-user";

export default function UserMenu() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (loading) return <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />;

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary px-5 py-2">
        Sign in
      </Link>
    );
  }

  const name = (user.user_metadata.full_name as string | undefined) ?? user.email ?? "You";
  const avatar = (user.user_metadata.avatar_url ?? user.user_metadata.picture) as string | undefined;

  const signOut = async () => {
    setOpen(false);
    await createClient().auth.signOut();
    toast.success("Signed out. See you soon!");
    router.push("/");
    router.refresh();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className="rounded-full ring-2 ring-white/10 transition hover:ring-white/40"
      >
        <Avatar src={avatar} name={name} size="h-10 w-10" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="card absolute right-0 mt-3 w-64 overflow-hidden p-2 shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
              <Avatar src={avatar} name={name} size="h-10 w-10 flex-none" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">{name}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </div>
            <MenuLink href="/bookings" onClick={() => setOpen(false)} icon="🎟️">
              My Bookings
            </MenuLink>
            <MenuLink href="/my-list" onClick={() => setOpen(false)} icon="❤️">
              My List
            </MenuLink>
            <MenuLink href="/tickets" onClick={() => setOpen(false)} icon="🍿">
              Book Tickets
            </MenuLink>
            <button
              type="button"
              onClick={signOut}
              className="mt-1 flex w-full items-center gap-3 rounded-lg border-t border-line px-3 py-2.5 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
            >
              <span aria-hidden>↩</span> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ href, icon, children, onClick }: { href: string; icon: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
    >
      <span aria-hidden>{icon}</span>
      {children}
    </Link>
  );
}

/** Profile photo with a graceful fallback to the user's initial. */
function Avatar({ src, name, size }: { src?: string; name: string; size: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  if (src && !failed) {
    return (
      // Google's avatar CDN rejects requests that carry a cross-site referrer,
      // so we send none. Plain <img>: no optimisation needed for a 40px photo.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${size} rounded-full object-cover`}
      />
    );
  }

  return (
    <span className={`${size} grid place-items-center rounded-full bg-gradient-to-br from-brand to-brand-2 text-sm font-bold text-white`}>
      {initials || "?"}
    </span>
  );
}
