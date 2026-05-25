import { useTranslation } from "react-i18next"

import type { BudgetItem, Expense } from "@/shared/types/budget"

import type { Stage } from "../services/stages.service"
import { BudgetCategoryCard } from "./BudgetCategoryCard"

interface BudgetCategoryListProps {
  items: BudgetItem[]
  stages: Stage[]
  isExpanded: (id: number) => boolean
  canMutate: boolean
  onToggle: (id: number) => void
  onEditItem: (item: BudgetItem) => void
  onDeleteItem: (item: BudgetItem) => void
  onAddExpense: (itemId: number) => void
  onEditExpense: (itemId: number, expense: Expense) => void
  onDeleteExpense: (expense: Expense) => void
}

export function BudgetCategoryList({
  items,
  stages,
  isExpanded,
  canMutate,
  onToggle,
  onEditItem,
  onDeleteItem,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: BudgetCategoryListProps) {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <div className="bg-surface-container-low rounded-xl p-12 text-center text-sm text-on-surface-variant">
        {t("obra.orcamento.category.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <BudgetCategoryCard
          key={item.id}
          item={item}
          stages={stages}
          expanded={isExpanded(item.id)}
          canMutate={canMutate}
          onToggle={() => onToggle(item.id)}
          onEdit={() => onEditItem(item)}
          onDelete={() => onDeleteItem(item)}
          onAddExpense={() => onAddExpense(item.id)}
          onEditExpense={(exp) => onEditExpense(item.id, exp)}
          onDeleteExpense={onDeleteExpense}
        />
      ))}
    </div>
  )
}
