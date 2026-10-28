import { useTranslation } from "react-i18next"

import type { ProjectBudget } from "@/shared/types/budget"
import { formatCurrency, formatDate } from "@/shared/utils/formatters"

import { useBudgetExpenses } from "../../../hooks/useBudgetExpenses"
import { SectionCard } from "../SectionCard"
import { WidgetSkeleton } from "./WidgetSkeleton"

const MAX = 5

interface RecentExpensesWidgetProps {
  projectId: number
  /** O orçamento que a Visão Geral já carregou; `null` = obra sem orçamento. */
  budget: ProjectBudget | null | undefined
}

/** Os últimos lançamentos, com a categoria do item e o valor. */
export function RecentExpensesWidget({ projectId, budget }: RecentExpensesWidgetProps) {
  const { t } = useTranslation()
  const { expenses, isLoading } = useBudgetExpenses(projectId, budget?.id ?? null)
  const categoryOf = new Map((budget?.items ?? []).map((item) => [item.id, item.category]))
  const recent = [...expenses].sort((a, b) => b.spentAt.localeCompare(a.spentAt)).slice(0, MAX)

  return (
    <SectionCard
      title={t("obra.visaoGeral.widgets.recent-expenses.title")}
      action={{ to: `/obras/${projectId}/orcamento`, label: t("obra.visaoGeral.widgets.recent-expenses.action") }}
    >
      {!budget ? (
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.noBudget")}</p>
      ) : isLoading ? (
        <WidgetSkeleton />
      ) : recent.length === 0 ? (
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.widgets.recent-expenses.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((expense) => (
            <li key={expense.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-[580] text-ink">{expense.description}</p>
                <p className="t-num text-[12px] text-meta">
                  {categoryOf.get(expense.budgetItemId) ?? "—"} · {formatDate(expense.spentAt)}
                </p>
              </div>
              <span className="t-num flex-none text-[13.5px] font-[600] text-ink">{formatCurrency(expense.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
