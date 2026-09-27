import { Loader2, Receipt } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { BudgetItem, Expense } from "@/shared/types/budget"

import { useExpenseForm } from "../../hooks/useExpenseForm"
import type { ExpenseFormData } from "../../schemas/budget.schema"
import type { Stage } from "../../services/stages.service"
import { ExpenseFields } from "./ExpenseFields"
import { ExpenseImpact } from "./ExpenseImpact"

interface ExpenseModalProps {
  open: boolean
  onClose: () => void
  items: BudgetItem[]
  stages: Stage[]
  expense: Expense | null
  defaultItemId: number | null
  isSubmitting: boolean
  onSubmit: (data: ExpenseFormData) => Promise<unknown>
}

/**
 * Lançar ou editar despesa (redesign): valor grande primeiro, prévia ao vivo
 * da categoria e, quando vai estourar, o botão vira "Lançar mesmo assim" em
 * perigo — a decisão fica explícita, sem bloquear.
 */
export function ExpenseModal({ open, onClose, items, stages, expense, defaultItemId, isSubmitting, onSubmit }: ExpenseModalProps) {
  const { t } = useTranslation()
  const state = useExpenseForm({ items, expense, defaultItemId, onSubmit })
  const willExceed = state.impact?.willExceed ?? false

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? t("obra.orcamento.expenseForm.editTitle") : t("obra.orcamento.expenseForm.createTitle")}
      icon={<Receipt size={18} />}
      size="lg"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onClose} disabled={isSubmitting}>
            {t("obra.orcamento.actions.cancel")}
          </Button>
          <Button variant={willExceed ? "destructive" : "primary"} fullWidth={false} onClick={state.handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {willExceed ? t("obra.orcamento.expenseForm.submitAnyway") : t("obra.orcamento.expenseForm.submit")}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="grid gap-4 px-6 pt-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          state.handleSave()
        }}
      >
        <ExpenseFields form={state.form} items={items} stages={stages} lockCategory={!!expense} />
        {state.impact && <ExpenseImpact impact={state.impact} />}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
