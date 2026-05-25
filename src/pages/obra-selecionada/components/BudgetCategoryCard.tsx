import { tv } from "tailwind-variants"

import type { BudgetItem, Expense } from "@/shared/types/budget"

import type { Stage } from "../services/stages.service"
import { BudgetCategoryExpenses } from "./BudgetCategoryExpenses"
import { BudgetCategoryHeader } from "./BudgetCategoryHeader"
import { BudgetCategoryMenu } from "./BudgetCategoryMenu"

const card = tv({
  base: "bg-surface-container rounded-xl border overflow-hidden transition-colors",
  variants: {
    exceeded: {
      true: "border-error/40",
      false: "border-outline-variant/20",
    },
  },
})

interface BudgetCategoryCardProps {
  item: BudgetItem
  stages: Stage[]
  expanded: boolean
  canMutate: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddExpense: () => void
  onEditExpense: (expense: Expense) => void
  onDeleteExpense: (expense: Expense) => void
}

export function BudgetCategoryCard({
  item,
  stages,
  expanded,
  canMutate,
  onToggle,
  onEdit,
  onDelete,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: BudgetCategoryCardProps) {
  return (
    <div className={card({ exceeded: item.exceeded })}>
      <div className="flex items-stretch">
        <BudgetCategoryHeader item={item} expanded={expanded} onToggle={onToggle} />
        {canMutate && (
          <div className="shrink-0 pt-4 pr-3">
            <BudgetCategoryMenu onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>

      {expanded && (
        <BudgetCategoryExpenses
          item={item}
          stages={stages}
          enabled={expanded}
          canMutate={canMutate}
          onAdd={onAddExpense}
          onEdit={onEditExpense}
          onDelete={onDeleteExpense}
        />
      )}
    </div>
  )
}
