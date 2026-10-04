export type ImageSize = "w185" | "w300" | "w500" | "w780" | "w1280" | "original";

/** TMDB's CDN already serves pre-sized images, so we just pick the right size. */
export function imageUrl(path: string | null, size: ImageSize = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function formatRuntime(minutes: number | null) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Money is stored in paise; ₹1 = 100 paise. */
export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    paise / 100,
  );
}

/**
 * Only allow same-site relative paths after login, so a crafted link like
 * /login?next=https://evil.com can't bounce users to another site.
 */
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

// ---- Dates: all showtimes are displayed in Indian Standard Time ----

const IST = "Asia/Kolkata";

/** "2026-10-04" for the IST calendar day of `date`. */
export function istDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: IST });
}

/** UTC instants for the start and end of an IST calendar day. */
export function istDayRange(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/** The next `count` IST days, for the date picker. */
export function upcomingDays(count: number, from = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      key: istDateKey(date),
      weekday: i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { timeZone: IST, weekday: "short" }),
      day: date.toLocaleDateString("en-IN", { timeZone: IST, day: "numeric" }),
      month: date.toLocaleDateString("en-IN", { timeZone: IST, month: "short" }),
    };
  });
}

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("en-IN", { timeZone: IST, weekday: "short", day: "numeric", month: "short" });
}

export function formatDateLong(date: Date) {
  return date.toLocaleDateString("en-IN", { timeZone: IST, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
