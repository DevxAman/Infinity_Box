import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-black text-red-600">404</p>
      <h1 className="text-2xl font-bold">Lost your way?</h1>
      <p className="max-w-md text-neutral-400">We couldn&apos;t find that page. There&apos;s plenty more to explore on the home page.</p>
      <Link href="/" className="rounded-md bg-white px-6 py-2.5 font-semibold text-black transition hover:bg-white/80">
        InfinityBox Home
      </Link>
    </div>
  );
}
