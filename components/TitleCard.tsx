import Image from "next/image";
import Link from "next/link";
import type { Title } from "@/lib/tmdb";
import { imageUrl } from "@/lib/utils";
import MyListButton from "./MyListButton";

interface Props {
  title: Title;
  priority?: boolean;
}

export default function TitleCard({ title, priority }: Props) {
  const src = imageUrl(title.posterPath, "w300");

  return (
    <Link
      href={`/title/${title.mediaType}/${title.id}`}
      className="group/card relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-surface-2 ring-1 ring-white/5 transition duration-300 hover:z-10 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-2xl hover:shadow-black/60 hover:ring-white/25 focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
      aria-label={`${title.title}${title.year ? ` (${title.year})` : ""}`}
    >
      {src && (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 15vw"
          className="object-cover transition duration-500 group-hover/card:scale-105"
          priority={priority}
        />
      )}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/50 to-transparent p-3 opacity-0 transition duration-300 group-hover/card:opacity-100 group-focus-visible/card:opacity-100">
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-amber-400">★ {title.rating.toFixed(1)}</span>
          <MyListButton title={title} variant="icon" />
        </div>
        <p className="line-clamp-2 text-sm font-semibold leading-tight text-white">{title.title}</p>
        <p className="mt-0.5 text-xs text-zinc-300">
          {title.year} · {title.mediaType === "tv" ? "Series" : "Movie"}
        </p>
      </div>
    </Link>
  );
}
