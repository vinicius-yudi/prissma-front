import type { ReactNode } from "react"

interface BudgetChartPanelProps {
  title: string
  children: ReactNode
}

export function BudgetChartPanel({ title, children }: BudgetChartPanelProps) {
  return (
    <div className="bg-surface-container rounded-xl p-5 border border-outline-variant/20">
      <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
        {title}
      </h3>
      {children}
    </div>
  )
}
