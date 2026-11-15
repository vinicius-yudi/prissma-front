/** Esqueleto do dashboard: a faixa de KPIs e os blocos de gráfico, na mesma grade. */
export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="h-[132px] animate-pulse rounded-lg bg-surface hairline" />
      <div className="h-[340px] animate-pulse rounded-lg bg-surface hairline" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[340px] animate-pulse rounded-lg bg-surface hairline" />
        <div className="h-[340px] animate-pulse rounded-lg bg-surface hairline" />
      </div>
    </div>
  )
}
