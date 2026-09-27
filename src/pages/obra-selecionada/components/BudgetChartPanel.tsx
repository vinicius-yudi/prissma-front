import type { ReactNode } from "react"

interface BudgetChartPanelProps {
  title: string
  children: ReactNode
}

export function BudgetChartPanel({ title, children }: BudgetChartPanelProps) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-border/20">
      <h3 className="text-xs font-bold uppercase tracking-widest text-ink-2 mb-4">
        {title}
      </h3>
      {children}
    </div>
  )
}
