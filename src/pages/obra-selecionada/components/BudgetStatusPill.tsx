import { AlertTriangle, CheckCircle2, TriangleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { BudgetTone } from "../utils/budgetMath"

const pill = tv({
  base: "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
  variants: {
    tone: {
      ok: "bg-primary/15 text-primary",
      warning: "bg-tertiary/15 text-tertiary",
      exceeded: "bg-error/15 text-error",
    },
  },
})

const ICONS: Record<BudgetTone, typeof CheckCircle2> = {
  ok: CheckCircle2,
  warning: TriangleAlert,
  exceeded: AlertTriangle,
}

interface BudgetStatusPillProps {
  tone: BudgetTone
  className?: string
}

export function BudgetStatusPill({ tone, className }: BudgetStatusPillProps) {
  const { t } = useTranslation()
  const Icon = ICONS[tone]
  return (
    <span className={pill({ tone, className })}>
      <Icon size={12} />
      {t(`obra.orcamento.status.${tone}`)}
    </span>
  )
}
