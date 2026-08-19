import { ExternalLink, Layers, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Expense } from "@/shared/types/budget"
import { formatCurrency, formatDate } from "@/shared/utils/formatters"

interface ExpenseRowProps {
  expense: Expense
  stageName?: string | null
  canMutate: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseRow({
  expense,
  stageName,
  canMutate,
  onEdit,
  onDelete,
}: ExpenseRowProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 border-b border-outline-variant/15 last:border-0">
      <div className="text-xs text-on-surface-variant tabular-nums w-20 flex-none">
        {formatDate(expense.spentAt)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface font-medium truncate">{expense.description}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant mt-0.5">
          <span>{expense.supplier?.trim() || t("obra.orcamento.expense.noSupplier")}</span>
          <span className="inline-flex items-center gap-1">
            <Layers size={11} />
            {stageName?.trim() || t("obra.orcamento.expense.noStage")}
          </span>
          {expense.receiptUrl && (
            <a
              href={expense.receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink size={11} />
              {t("obra.orcamento.expense.receipt")}
            </a>
          )}
        </div>
      </div>

      <div className="text-sm font-bold text-on-surface tabular-nums shrink-0 px-2">
        {formatCurrency(expense.amount)}
      </div>

      {canMutate && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(expense)}
            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            aria-label={t("obra.orcamento.actions.editExpense")}
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(expense)}
            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
            aria-label={t("obra.orcamento.actions.deleteExpense")}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
