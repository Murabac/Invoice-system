export function PageSkeleton() {
  return (
    <div className="flex flex-1 flex-col animate-pulse">
      <div className="border-b border-gray-200 bg-surface px-8 py-5">
        <div className="h-8 w-48 rounded-lg bg-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="flex-1 space-y-4 p-8">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-gray-200 bg-surface"
            />
          ))}
        </div>
        <div className="h-40 rounded-xl border border-gray-200 bg-surface" />
      </div>
    </div>
  );
}
