export default function WritingArticleLoading() {
  return (
    <div className="space-y-8">
      <div className="h-4 w-24 animate-pulse rounded-full bg-[var(--surface-strong)]" />
      <div className="space-y-4 border-b border-[var(--line-soft)] pb-8">
        <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-[var(--surface-strong)]" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-[var(--surface-strong)]" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="surface-card hidden h-52 animate-pulse lg:block" />
        <div className="surface-card animate-pulse p-8">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-4 rounded-full bg-[var(--surface-strong)]"
                style={{ width: `${index % 3 === 0 ? 90 : index % 3 === 1 ? 100 : 78}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
