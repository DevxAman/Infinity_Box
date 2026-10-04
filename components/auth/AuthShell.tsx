import Image from "next/image";
import { ROWS } from "@/lib/tmdb";
import { imageUrl } from "@/lib/utils";

/** Split-screen layout: scrolling poster wall on the left, form on the right. */
export default async function AuthShell({ children }: { children: React.ReactNode }) {
  const posters = (await ROWS.trending.fetch().catch(() => [])).map((t) => t.posterPath).filter(Boolean) as string[];
  const columns = [0, 1, 2].map((c) => posters.filter((_, i) => i % 3 === c));

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block" aria-hidden>
        <div className="absolute inset-0 grid -rotate-6 scale-125 grid-cols-3 gap-4 opacity-60">
          {columns.map((col, c) => (
            <div key={c} className={`animate-marquee-up space-y-4 ${c === 1 ? "[animation-direction:reverse]" : ""}`}>
              {/* Duplicated so the loop is seamless */}
              {[...col, ...col].map((path, i) => (
                <div key={i} className="relative aspect-[2/3] overflow-hidden rounded-xl">
                  <Image src={imageUrl(path, "w300")!} alt="" fill sizes="20vw" className="object-cover" />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        <div className="absolute bottom-16 left-12 right-12">
          <p className="text-5xl font-black leading-tight tracking-tight text-white">
            Unlimited stories.
            <br />
            <span className="text-gradient">One ticket away.</span>
          </p>
          <p className="mt-4 max-w-md text-lg text-zinc-300">
            Watch trailers, save your favourites, and book the best seats in the house.
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-4 pb-12 pt-28 sm:px-8">
        <div className="pointer-events-none absolute top-1/4 h-72 w-72 rounded-full bg-brand/20 blur-[100px]" />
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
