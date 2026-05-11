export default function WritingLoading() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="surface-card animate-pulse p-6">
          <div className="h-3 w-32 rounded-full bg-[var(--surface-strong)]" />
          <div className="mt-5 h-8 w-3/4 rounded-full bg-[var(--surface-strong)]" />
          <div className="mt-5 space-y-3">
            <div className="h-3 rounded-full bg-[var(--surface-strong)]" />
            <div className="h-3 rounded-full bg-[var(--surface-strong)]" />
            <div className="h-3 w-2/3 rounded-full bg-[var(--surface-strong)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
