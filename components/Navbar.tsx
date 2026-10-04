"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV Shows" },
  { href: "/tickets", label: "Tickets" },
  { href: "/my-list", label: "My List" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-b border-line bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent bg-gradient-to-b from-black/80 to-transparent"
      }`}
    >
      <nav className="flex h-16 items-center gap-8 px-4 sm:px-12" aria-label="Main">
        <Link href="/" aria-label="InfinityBox home" className="flex-none">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 text-sm lg:flex">
          {LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative z-10 flex items-center gap-1.5 rounded-full px-4 py-2 transition ${
                    active ? "font-semibold text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.label}
                  {link.href === "/tickets" && (
                    <span className="rounded-full bg-gradient-to-r from-brand to-brand-2 px-1.5 py-px text-[10px] font-bold text-white">
                      NEW
                    </span>
                  )}
                </Link>
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Suspense fallback={<div className="h-10 w-10" />}>
            <SearchBox />
          </Suspense>
          <UserMenu />
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full text-white hover:bg-white/10 lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 lg:hidden"
          >
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`my-1 block rounded-xl px-4 py-3 ${
                    isActive(pathname, link.href) ? "bg-white/10 font-semibold text-white" : "text-zinc-300"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="h-3" />
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}

/** Expanding search input; debounced navigation to /search?q=... */
function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initial = pathname === "/search" ? (params.get("q") ?? "") : "";
  const [query, setQuery] = useState(initial);
  const [open, setOpen] = useState(Boolean(initial));
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (q: string) => {
    const trimmed = q.trim();
    if (trimmed) router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false });
  };

  const onChange = (value: string) => {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go(value), 400);
  };

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        clearTimeout(timer.current);
        go(query);
      }}
      className={`flex items-center rounded-full border transition-all duration-300 ${
        open ? "w-40 border-white/20 bg-black/60 sm:w-64" : "w-10 border-transparent"
      }`}
    >
      <button
        type="button"
        aria-label="Search"
        className="grid h-10 w-10 flex-none place-items-center rounded-full text-white hover:bg-white/10"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => !query && setOpen(false)}
        placeholder="Movies, shows, people"
        aria-label="Search titles"
        className={`w-full bg-transparent pr-4 text-sm text-white placeholder:text-zinc-500 focus:outline-none ${open ? "" : "hidden"}`}
      />
    </form>
  );
}
