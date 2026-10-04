import { Suspense } from "react";
import { ROWS, type RowKey } from "@/lib/tmdb";
import { AsyncRow, RowSkeleton } from "./Row";

export default function RowList({ rows }: { rows: RowKey[] }) {
  return (
    <div className="space-y-8 sm:space-y-10">
      {rows.map((key) => (
        <Suspense key={key} fallback={<RowSkeleton />}>
          <AsyncRow label={ROWS[key].label} fetchTitles={ROWS[key].fetch} />
        </Suspense>
      ))}
    </div>
  );
}
