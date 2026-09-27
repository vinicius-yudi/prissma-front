import { Receipt } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import type { Expense } from "@/shared/types/budget"

import { ExpenseTableRow } from "./ExpenseTableRow"

interface ExpensesTableBodyProps {
  rows: Expense[]
  isLoading: boolean
  categoryById: Map<number, string>
  stageById: Map<number, string>
  canMutate: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/** Corpo da tabela de lançamentos: carregando, vazio ou as linhas. */
export function ExpensesTableBody({ rows, isLoading, categoryById, stageById, canMutate, onEdit, onDelete }: ExpensesTableBodyProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="space-y-2 px-5 pb-5 sm:px-6" aria-busy="true">
        <div className="h-10 animate-pulse rounded-sm bg-raised" />
        <div className="h-10 animate-pulse rounded-sm bg-raised" />
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="p-5">
        <EmptyState icon={<Receipt size={26} />} title={t("obra.orcamento.expenses.emptyTitle")} body={t("obra.orcamento.expenses.emptyBody")} />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-[13.5px]">
        <thead>
          <tr className="border-y border-border text-left text-[12px] text-meta">
            <th className="px-5 py-2.5 font-[560] sm:px-6">{t("obra.orcamento.expenses.date")}</th>
            <th className="px-3 py-2.5 font-[560]">{t("obra.orcamento.expenseForm.description")}</th>
            <th className="px-3 py-2.5 font-[560]">{t("obra.orcamento.itemForm.category")}</th>
            <th className="px-3 py-2.5 font-[560]">{t("obra.orcamento.expenses.supplier")}</th>
            <th className="px-3 py-2.5 text-right font-[560]">{t("obra.orcamento.expenses.amount")}</th>
            <th className="w-20">
              <span className="sr-only">{t("obra.orcamento.expenses.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {rows.map((expense) => (
              <ExpenseTableRow
                key={expense.id}
                expense={expense}
                category={categoryById.get(expense.budgetItemId) ?? "—"}
                stageName={expense.stageId ? (stageById.get(expense.stageId) ?? null) : null}
                canMutate={canMutate}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
