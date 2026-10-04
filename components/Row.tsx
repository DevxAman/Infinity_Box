import Image from "next/image";
import Link from "next/link";
import type { Title } from "@/lib/tmdb";
import { imageUrl } from "@/lib/utils";
import TitleCard from "./TitleCard";
import RowScroller from "./RowScroller";

const CARD_WIDTH = "w-[38vw] sm:w-[22vw] md:w-[17vw] lg:w-[13vw] xl:w-[11vw]";

interface Props {
  label: string;
  titles: Title[];
}

export function Row({ label, titles }: Props) {
  if (titles.length === 0) return null;

  return (
    <section aria-label={label} className="relative">
      <h2 className="section-title">{label}</h2>
      <RowScroller>
        {titles.map((t) => (
          <div key={`${t.mediaType}-${t.id}`} className={`flex-none snap-start ${CARD_WIDTH}`}>
            <TitleCard title={t} />
          </div>
        ))}
      </RowScroller>
    </section>
  );
}

/** Netflix-style Top 10 with giant outlined rank numbers. */
export function Top10Row({ label, titles }: Props) {
  if (titles.length === 0) return null;

  return (
    <section aria-label={label} className="relative">
      <h2 className="section-title">{label}</h2>
      <RowScroller>
        {titles.slice(0, 10).map((t, i) => (
          <Link
            key={t.id}
            href={`/title/${t.mediaType}/${t.id}`}
            className="group flex w-[56vw] flex-none snap-start items-end sm:w-[34vw] md:w-[26vw] lg:w-[20vw] xl:w-[16vw]"
            aria-label={`Number ${i + 1}: ${t.title}`}
          >
            <span className="stroke-number -mr-4 select-none text-[7rem] leading-[0.8] font-black tracking-tighter sm:text-[9rem]" aria-hidden>
              {i + 1}
            </span>
            <div className="relative aspect-[2/3] w-[58%] flex-none overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:ring-white/30">
              <Image src={imageUrl(t.posterPath, "w300")!} alt="" fill sizes="20vw" className="object-cover" />
            </div>
          </Link>
        ))}
      </RowScroller>
    </section>
  );
}

/** Fetches its own data so each row streams in independently via Suspense. */
export async function AsyncRow({
  label,
  fetchTitles,
  variant = "default",
}: {
  label: string;
  fetchTitles: () => Promise<Title[]>;
  variant?: "default" | "top10";
}) {
  try {
    const titles = await fetchTitles();
    return variant === "top10" ? <Top10Row label={label} titles={titles} /> : <Row label={label} titles={titles} />;
  } catch (err) {
    // One failing row should not take down the whole page.
    console.error(`[row] "${label}" failed:`, err);
    return null;
  }
}

export function RowSkeleton() {
  return (
    <div className="px-4 sm:px-12" aria-hidden>
      <div className="mb-4 h-6 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`aspect-[2/3] flex-none animate-pulse rounded-xl bg-white/[0.06] ${CARD_WIDTH}`} />
        ))}
      </div>
    </div>
  );
}
