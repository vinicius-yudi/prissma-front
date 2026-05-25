import { useMemo } from "react"

import type { BudgetItem } from "@/shared/types/budget"

import { donutColor } from "../utils/budgetChartColors"

interface BudgetCategoryDonutLegendProps {
  items: BudgetItem[]
}

interface LegendDatum {
  id: number
  category: string
  percent: number
  color: string
}

export function BudgetCategoryDonutLegend({ items }: BudgetCategoryDonutLegendProps) {
  const data = useMemo<LegendDatum[]>(() => {
    const filtered = items.filter((i) => i.totalSpent > 0)
    const total = filtered.reduce((acc, i) => acc + i.totalSpent, 0)
    return filtered.map((item, idx) => ({
      id: item.id,
      category: item.category,
      percent: total > 0 ? Math.round((item.totalSpent / total) * 100) : 0,
      color: donutColor(idx),
    }))
  }, [items])

  if (data.length === 0) return null

  return (
    <ul className="space-y-1.5 text-xs">
      {data.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-none"
              style={{ background: entry.color }}
            />
            <span className="text-on-surface truncate">{entry.category}</span>
          </div>
          <span className="text-on-surface-variant tabular-nums flex-none">
            {entry.percent}%
          </span>
        </li>
      ))}
    </ul>
  )
}
