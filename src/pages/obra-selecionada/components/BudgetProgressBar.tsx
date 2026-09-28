import { Progress, type ProgressTone } from "@/shared/components/ui/progress/Progress"

import type { BudgetTone } from "../utils/budgetMath"
import { resolveBudgetTone } from "../utils/budgetMath"

/**
 * Barra de orçamento.
 *
 * Era uma barra própria, sem a trena — ou seja, a única no sistema que não
 * carregava a assinatura. Agora é só a tradução do tom de orçamento para o tom
 * do <Progress>, que é o componente autorizado a desenhar barra.
 */

const TONE: Record<BudgetTone, ProgressTone> = {
  ok: "gold",
  warning: "warn",
  exceeded: "danger",
}

const HEIGHT = { sm: 6, md: 8, lg: 12 } as const

interface BudgetProgressBarProps {
  percent: number
  tone?: BudgetTone
  exceeded?: boolean
  height?: keyof typeof HEIGHT
  label?: string
  className?: string
}

export function BudgetProgressBar({
  percent,
  tone,
  exceeded,
  height = "md",
  label,
  className,
}: BudgetProgressBarProps) {
  const resolved = tone ?? resolveBudgetTone(percent, exceeded)

  return (
    <Progress
      value={Number.isFinite(percent) ? percent : 0}
      tone={TONE[resolved]}
      height={HEIGHT[height]}
      label={label}
      className={className}
    />
  )
}
