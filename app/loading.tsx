import { RowSkeleton } from "@/components/Row";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="h-[85vh] min-h-[560px] w-full animate-pulse bg-surface" />
      <div className="-mt-24 space-y-8 pb-16">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}
