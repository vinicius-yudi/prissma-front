import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"

const iconWrap = tv({
  base: "p-2 rounded-lg",
  variants: {
    accent: {
      default: "bg-gold/10 text-gold",
      warning: "bg-warning/15 text-warning",
      danger: "bg-danger/15 text-danger",
    },
  },
  defaultVariants: {
    accent: "default",
  },
})

export type BudgetKpiAccent = "default" | "warning" | "danger"

interface BudgetKpiCardProps {
  label: string
  value: ReactNode
  icon: ReactNode
  accent?: BudgetKpiAccent
  hint?: ReactNode
}

export function BudgetKpiCard({
  label,
  value,
  icon,
  accent = "default",
  hint,
}: BudgetKpiCardProps) {
  return (
    <div className="bg-surface rounded-xl p-4 border border-border/20 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={iconWrap({ accent })}>{icon}</div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-ink-2">
          {label}
        </span>
      </div>
      <Num className="text-xl font-bold text-ink">{value}</Num>
      {hint && <div className="text-xs text-ink-2">{hint}</div>}
    </div>
  )
}
