import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

const iconWrap = tv({
  base: "p-2 rounded-lg",
  variants: {
    accent: {
      default: "bg-primary/10 text-primary",
      warning: "bg-tertiary/15 text-tertiary",
      danger: "bg-error/15 text-error",
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
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/20 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={iconWrap({ accent })}>{icon}</div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>
      <div className="text-xl font-black text-on-surface tabular-nums">{value}</div>
      {hint && <div className="text-xs text-on-surface-variant">{hint}</div>}
    </div>
  )
}
