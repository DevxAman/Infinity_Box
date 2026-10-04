import type { Title } from "@/lib/tmdb";
import TitleCard from "./TitleCard";

export default function TitleGrid({ titles }: { titles: Title[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
      {titles.map((t, i) => (
        <li key={`${t.mediaType}-${t.id}`}>
          <TitleCard title={t} priority={i < 7} />
        </li>
      ))}
    </ul>
  );
}
