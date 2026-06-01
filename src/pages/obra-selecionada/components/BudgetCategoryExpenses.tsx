import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import type { BudgetItem, Expense } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { useCategoryExpenses } from "../hooks/useCategoryExpenses"
import type { Stage } from "../services/stages.service"
import { ExpenseRow } from "./ExpenseRow"

interface BudgetCategoryExpensesProps {
  item: BudgetItem
  stages: Stage[]
  enabled: boolean
  canMutate: boolean
  onAdd: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

function ExpensesSkeleton() {
  return (
    <div className="space-y-2 py-2">
      <div className="h-8 bg-surface-container-highest animate-pulse rounded" />
      <div className="h-8 bg-surface-container-highest animate-pulse rounded" />
    </div>
  )
}

export function BudgetCategoryExpenses({
  item,
  stages,
  enabled,
  canMutate,
  onAdd,
  onEdit,
  onDelete,
}: BudgetCategoryExpensesProps) {
  const { t } = useTranslation()
  const { expenses, isLoading } = useCategoryExpenses(item.id, enabled)

  const stageNameById = new Map(stages.map((s) => [s.id, s.name]))

  return (
    <div className="px-4 pb-4 pt-2 border-t border-outline-variant/15 bg-surface-container-low">
      <div className="sm:hidden mb-3 flex justify-between text-sm tabular-nums">
        <span className="text-on-surface-variant">
          {formatCurrency(item.totalSpent)} / {formatCurrency(item.plannedAmount)}
        </span>
      </div>

      {isLoading && <ExpensesSkeleton />}

      {!isLoading && expenses.length === 0 && (
        <p className="text-xs text-on-surface-variant py-4 text-center">
          {t("obra.orcamento.category.empty")}
        </p>
      )}

      {!isLoading && expenses.length > 0 && (
        <div>
          {expenses.map((exp) => (
            <ExpenseRow
              key={exp.id}
              expense={exp}
              stageName={exp.stageId ? stageNameById.get(exp.stageId) ?? null : null}
              canMutate={canMutate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {canMutate && (
        <div className="mt-3">
          <Button variant="outline" onClick={onAdd} className="w-auto px-3 py-2 text-xs">
            <Plus size={14} />
            {t("obra.orcamento.actions.addExpense")}
          </Button>
        </div>
      )}
    </div>
  )
}
