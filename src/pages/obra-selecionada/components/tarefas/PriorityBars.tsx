import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { TarefaPriority } from "../../types/tarefas"

const LEVEL: Record<TarefaPriority, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 }
const BARS = [1, 2, 3]

const bar = tv({
  base: "w-[3px] rounded-[1px]",
  variants: {
    on: { true: "", false: "bg-border-strong" },
    high: { true: "", false: "" },
  },
  compoundVariants: [
    { on: true, high: true, className: "bg-danger" },
    { on: true, high: false, className: "bg-ink-2" },
  ],
})

/** Prioridade como três barrinhas de sinal — alta acende em perigo. */
export function PriorityBars({ priority }: { priority: TarefaPriority }) {
  const { t } = useTranslation()
  const level = LEVEL[priority] ?? 1
  const label = t("obra.tarefas.priorityLabel", { priority: t(`obra.tarefas.priority.${priority}`).toLowerCase() })

  return (
    <span role="img" aria-label={label} title={label} className="inline-flex flex-none items-end gap-[2px]">
      {BARS.map((i) => (
        <span key={i} className={bar({ on: i <= level, high: level === 3 })} style={{ height: 4 + i * 3 }} />
      ))}
    </span>
  )
}
