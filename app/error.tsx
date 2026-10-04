"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-neutral-400">
        We couldn&apos;t load this page. The movie database may be temporarily unavailable.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-red-600 px-6 py-2.5 font-semibold text-white transition hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}
