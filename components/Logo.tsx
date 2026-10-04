/** InfinityBox wordmark: an infinity loop in the brand gradient. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 48 24" className="h-6 w-12 flex-none" aria-hidden>
        <defs>
          <linearGradient id="ibx-logo-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="#f43f5e" />
            <stop offset="1" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        <path
          d="M12 4a8 8 0 1 0 0 16c4.4 0 7.6-4 12-8s7.6-8 12-8a8 8 0 1 1 0 16c-4.4 0-7.6-4-12-8S16.4 4 12 4z"
          fill="none"
          stroke="url(#ibx-logo-gradient)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xl font-black tracking-tight text-white">
        Infinity<span className="text-gradient">Box</span>
      </span>
    </span>
  );
}
