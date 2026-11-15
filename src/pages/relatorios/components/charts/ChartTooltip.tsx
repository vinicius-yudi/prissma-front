import type { TooltipPayloadEntry } from "recharts"

interface ChartTooltipProps {
  /** Injetados pelo Recharts ao clonar o elemento passado em `content`. */
  active?: boolean
  payload?: readonly TooltipPayloadEntry[]
  label?: string | number
  formatLabel: (label: string) => string
  formatValue: (value: number) => string
}

/**
 * Tooltip dos gráficos no padrão do DS (camada `inverse`, como o da curva S).
 * Cada linha leva o traço da série além do nome — a cor nunca é a única pista.
 */
export function ChartTooltip({ active, payload, label, formatLabel, formatValue }: ChartTooltipProps) {
  const entries = (payload ?? []).filter((entry) => typeof entry.value === "number")
  if (!active || entries.length === 0) return null

  return (
    <div className="rounded-[10px] bg-inverse px-3 py-2 text-[12px] text-on-inverse shadow-lift">
      <p className="mb-1 font-[640]">{formatLabel(String(label ?? ""))}</p>
      {entries.map((entry) => (
        <p key={String(entry.dataKey)} className="flex items-center gap-2">
          <span className="h-[3px] w-3 rounded-pill" style={{ backgroundColor: entry.color }} />
          <span className="opacity-80">{entry.name}</span>
          <span className="t-num ml-auto pl-3">{formatValue(Number(entry.value))}</span>
        </p>
      ))}
    </div>
  )
}
