export interface LegendItem {
  label: string
  /** `var(--token)`. */
  color: string
  dashed?: boolean
}

/** Legenda dos gráficos: traço da série (contínuo ou tracejado) + rótulo. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-meta">
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-1.5">
          <svg width="20" height="4" aria-hidden="true">
            <line x1="0" x2="20" y1="2" y2="2" stroke={item.color} strokeWidth="3" strokeDasharray={item.dashed ? "4 3" : undefined} />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
