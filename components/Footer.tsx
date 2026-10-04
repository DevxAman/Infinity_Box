import Link from "next/link";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { href: "/", label: "Home" },
      { href: "/movies", label: "Movies" },
      { href: "/tv", label: "TV Shows" },
      { href: "/search", label: "Search" },
    ],
  },
  {
    title: "Tickets",
    links: [
      { href: "/tickets", label: "Now in Theaters" },
      { href: "/bookings", label: "My Bookings" },
      { href: "/my-list", label: "My List" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/50 px-4 py-14 text-sm sm:px-12">
      <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-sm space-y-4">
          <Logo />
          <p className="text-muted">
            Trailers, watchlists and theater tickets in one place. Pick your seats, pay securely, and walk in with a QR ticket.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 font-semibold text-white">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-zinc-500 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} InfinityBox. Payments secured by Razorpay.</p>
        <p>
          Movie data from{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-300">
            TMDB
          </a>
          . This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
