import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that need auth. Browse pages stay fully static and cacheable.
  matcher: ["/book/show/:path*", "/checkout/:path*", "/bookings/:path*", "/login", "/signup"],
};
