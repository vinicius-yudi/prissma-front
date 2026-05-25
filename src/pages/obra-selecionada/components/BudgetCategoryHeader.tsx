import { ChevronDown, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { BudgetItem } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { calculatePercent, resolveBudgetTone } from "../utils/budgetMath"
import { BudgetProgressBar } from "./BudgetProgressBar"
import { BudgetStatusPill } from "./BudgetStatusPill"

interface BudgetCategoryHeaderProps {
  item: BudgetItem
  expanded: boolean
  onToggle: () => void
}

export function BudgetCategoryHeader({
  item,
  expanded,
  onToggle,
}: BudgetCategoryHeaderProps) {
  const { t } = useTranslation()
  const percent = calculatePercent(item.totalSpent, item.plannedAmount)
  const tone = resolveBudgetTone(percent, item.exceeded)

  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex-1 min-w-0 px-4 py-4 flex items-center gap-3 hover:bg-surface-container-high transition-colors text-left cursor-pointer"
      aria-expanded={expanded}
      aria-label={
        expanded
          ? t("obra.orcamento.category.collapse")
          : t("obra.orcamento.category.expand")
      }
    >
      <span className="flex-none text-on-surface-variant">
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-on-surface truncate">{item.category}</h3>
          <BudgetStatusPill tone={tone} />
        </div>
        {item.description && (
          <p className="text-xs text-on-surface-variant truncate mt-0.5">
            {item.description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <BudgetProgressBar percent={percent} exceeded={item.exceeded} height="sm" />
          <span className="text-xs text-on-surface-variant tabular-nums flex-none">
            {Math.round(percent)}%
          </span>
        </div>
      </div>

      <div className="text-right tabular-nums shrink-0 hidden sm:block">
        <p className="text-sm font-bold text-on-surface">
          {formatCurrency(item.totalSpent)}
        </p>
        <p className="text-xs text-on-surface-variant">
          / {formatCurrency(item.plannedAmount)}
        </p>
      </div>
    </button>
  )
}
