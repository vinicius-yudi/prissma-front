/** Linhas pulsando enquanto o widget carrega — mesma altura média do conteúdo. */
export function WidgetSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-sm bg-ink/5" />
      ))}
    </div>
  )
}
