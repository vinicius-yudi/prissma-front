import { ExternalLink, Pencil, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { Expense } from "@/shared/types/budget"
import { formatCurrency, formatDate } from "@/shared/utils/formatters"

const action = tv({
  base: "flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-meta transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
  variants: {
    danger: { true: "hover:bg-danger-soft hover:text-danger", false: "hover:bg-raised hover:text-ink" },
  },
  defaultVariants: { danger: false },
})

interface ExpenseTableRowProps {
  expense: Expense
  category: string
  stageName: string | null
  canMutate: boolean
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/** Linha de lançamento; editar e excluir aparecem no hover (sempre no toque). */
export function ExpenseTableRow({ expense, category, stageName, canMutate, onEdit, onDelete }: ExpenseTableRowProps) {
  const { t } = useTranslation()

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="group border-b border-border last:border-0 hover:bg-raised/60"
    >
      <td className="t-num px-5 py-3 whitespace-nowrap text-ink-2 sm:px-6">{formatDate(expense.spentAt)}</td>
      <td className="px-3 py-3">
        <span className="font-[540] text-ink">{expense.description}</span>
        {stageName && <span className="block text-[12px] text-meta">{stageName}</span>}
      </td>
      <td className="px-3 py-3 text-ink-2">{category}</td>
      <td className="px-3 py-3 text-ink-2">
        {expense.supplier?.trim() || "—"}
        {expense.receiptUrl && (
          <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="ml-2 inline-flex items-center gap-1 text-[12px] text-gold-hi hover:underline">
            <ExternalLink size={11} />
            {t("obra.orcamento.expense.receipt")}
          </a>
        )}
      </td>
      <td className="t-num px-3 py-3 text-right font-[620] whitespace-nowrap text-ink">{formatCurrency(expense.amount)}</td>
      <td className="pr-3">
        {canMutate && (
          <span className="flex justify-end">
            <button type="button" onClick={() => onEdit(expense)} aria-label={t("obra.orcamento.actions.editExpense")} className={action()}>
              <Pencil size={14} />
            </button>
            <button type="button" onClick={() => onDelete(expense)} aria-label={t("obra.orcamento.actions.deleteExpense")} className={action({ danger: true })}>
              <Trash2 size={14} />
            </button>
          </span>
        )}
      </td>
    </motion.tr>
  )
}
