"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

interface Props {
  mode: "login" | "signup";
  next: string;
  initialError?: string;
}

const FRIENDLY_ERRORS: Record<string, string> = {
  "Invalid login credentials": "That email and password don't match. Please try again.",
  "Email not confirmed": "Please confirm your email first. Check your inbox for the link.",
  "User already registered": "An account with this email already exists. Try signing in instead.",
};

export default function AuthForm({ mode, next, initialError }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState(initialError ?? "");
  const [checkInbox, setCheckInbox] = useState(false);

  const isSignup = mode === "signup";
  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (isSignup && password.length < 8) return setError("Password must be at least 8 characters.");

    setLoading("email");
    const supabase = createClient();
    const { data, error } = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: callbackUrl() },
        })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(null);

    if (error) return setError(FRIENDLY_ERRORS[error.message] ?? error.message);

    // Sign-up with email confirmation enabled returns no session yet.
    if (isSignup && !data.session) return setCheckInbox(true);

    toast.success(isSignup ? "Welcome to InfinityBox! 🎉" : "Welcome back!");
    router.replace(next);
    router.refresh();
  };

  const signInWithGoogle = async () => {
    setError("");
    setLoading("google");
    const { error } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
    if (error) {
      setLoading(null);
      setError(error.message.includes("not enabled") ? "Google sign-in isn't enabled yet. Use email for now." : error.message);
    }
  };

  if (checkInbox) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card space-y-4 p-8 text-center">
        <p className="text-5xl">📬</p>
        <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
        <p className="text-muted">
          We sent a confirmation link to <b className="text-white">{email}</b>. Click it to activate your account.
        </p>
        <button type="button" onClick={() => setCheckInbox(false)} className="btn btn-glass w-full">
          Back
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-muted">{isSignup ? "Join free and book your first show in minutes." : "Sign in to book tickets and see your bookings."}</p>

      {!isSupabaseConfigured && (
        <p className="mt-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
          Authentication isn&apos;t configured yet. Add your Supabase keys to <code>.env.local</code>.
        </p>
      )}

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={loading !== null || !isSupabaseConfigured}
        className="btn btn-light mt-8 w-full py-3.5"
      >
        {loading === "google" ? <Spinner dark /> : <GoogleIcon />}
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4 text-xs tracking-widest text-zinc-500 uppercase">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
        {isSignup && (
          <Field label="Full name">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" placeholder="Your name" />
          </Field>
        )}
        <Field label="Email">
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" hint={isSignup ? "At least 8 characters" : undefined}>
          <div className="relative">
            <input
              className="input pr-16"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={isSignup ? 8 : undefined}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-3 my-auto h-fit rounded px-2 py-1 text-xs font-semibold text-zinc-400 hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </motion.p>
        )}

        <button type="submit" disabled={loading !== null || !isSupabaseConfigured} className="btn btn-primary w-full py-3.5 text-base">
          {loading === "email" && <Spinner />}
          {isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to InfinityBox? "}
        <Link
          href={`${isSignup ? "/login" : "/signup"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-white underline-offset-4 hover:underline"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </motion.div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex justify-between text-sm font-medium text-zinc-300">
        {label}
        {hint && <span className="text-xs font-normal text-zinc-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return <span className={`h-4 w-4 animate-spin rounded-full border-2 ${dark ? "border-black/20 border-t-black" : "border-white/30 border-t-white"}`} />;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}
