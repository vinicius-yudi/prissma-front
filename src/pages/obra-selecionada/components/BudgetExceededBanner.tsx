import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Num } from "@/shared/components/ui/num/Num"
import type { ProjectBudget } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

/**
 * Banner de estouro (Telas §16).
 *
 * **Permanece na tela** enquanto houver estouro — não é toast. Estouro de
 * orçamento é condição, não evento: um aviso que desaparece em 3 segundos é
 * exatamente o que faz o usuário descobrir o problema no fechamento do mês.
 *
 * Mostra a categoria mais estourada em valor absoluto, com previsto, executado
 * e desvio em mono.
 */

interface BudgetExceededBannerProps {
  budget: ProjectBudget
  onReview: (itemId: number) => void
}

export function BudgetExceededBanner({ budget, onReview }: BudgetExceededBannerProps) {
  const { t } = useTranslation()

  const exceeded = budget.items.filter((item) => item.exceeded)
  if (exceeded.length === 0) return null

  // A pior categoria é a de maior desvio absoluto, não a primeira da lista.
  const worst = exceeded.reduce((acc, item) =>
    item.totalSpent - item.plannedAmount > acc.totalSpent - acc.plannedAmount ? item : acc,
  )
  const deviation = worst.totalSpent - worst.plannedAmount

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-danger/40 bg-danger-bg p-4 sm:flex-row sm:items-center">
      <AlertTriangle size={20} strokeWidth={1.9} className="shrink-0 text-danger" />

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold text-danger">
          {t("obra.orcamento.exceededBanner.title", { category: worst.category })}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-on-surface-variant">
          <span>
            {t("obra.orcamento.kpi.planned")}{" "}
            <Num className="font-semibold text-on-surface">
              {formatCurrency(worst.plannedAmount)}
            </Num>
          </span>
          <span>
            {t("obra.orcamento.kpi.spent")}{" "}
            <Num className="font-semibold text-on-surface">
              {formatCurrency(worst.totalSpent)}
            </Num>
          </span>
          <span>
            {t("obra.orcamento.exceededBanner.deviation")}{" "}
            <Num className="font-semibold text-danger">+{formatCurrency(deviation)}</Num>
          </span>
          {exceeded.length > 1 && (
            <span className="text-danger">
              {t("obra.orcamento.exceededBanner.others", { count: exceeded.length - 1 })}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onReview(worst.id)}
        className="shrink-0 cursor-pointer self-start rounded-xl border border-danger/50 px-3.5 py-2 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/10 sm:self-auto"
      >
        {t("obra.orcamento.exceededBanner.action")} ↗
      </button>
    </div>
  )
}
