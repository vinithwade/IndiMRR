export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <div className="h-3 w-24 bg-muted/80" />
        <div className="h-8 w-56 bg-muted" />
        <div className="h-3 w-40 bg-muted/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 border border-border/60 bg-card/40" />
        ))}
      </div>
      <div className="h-48 border border-border/60 bg-card/30" />
      <div className="h-64 border border-border/60 bg-card/30" />
    </div>
  );
}
