import { tv } from "tailwind-variants"

import type { BudgetTone } from "../utils/budgetMath"
import { resolveBudgetTone } from "../utils/budgetMath"

const track = tv({
  base: "w-full bg-surface-container-highest rounded-full overflow-hidden",
  variants: {
    height: {
      sm: "h-1.5",
      md: "h-2",
      lg: "h-3",
    },
  },
  defaultVariants: {
    height: "md",
  },
})

const fill = tv({
  base: "h-full rounded-full transition-all duration-500 ease-out",
  variants: {
    tone: {
      ok: "bg-primary",
      warning: "bg-tertiary",
      exceeded: "bg-error",
    },
  },
})

interface BudgetProgressBarProps {
  percent: number
  tone?: BudgetTone
  exceeded?: boolean
  height?: "sm" | "md" | "lg"
  className?: string
}

export function BudgetProgressBar({
  percent,
  tone,
  exceeded,
  height = "md",
  className,
}: BudgetProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0))
  const resolvedTone = tone ?? resolveBudgetTone(percent, exceeded)

  return (
    <div className={track({ height, className })}>
      <div className={fill({ tone: resolvedTone })} style={{ width: `${clamped}%` }} />
    </div>
  )
}
