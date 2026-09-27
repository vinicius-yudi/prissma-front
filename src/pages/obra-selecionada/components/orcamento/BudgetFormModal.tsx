import { Coins } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { ProjectBudget } from "@/shared/types/budget"

import { useBudgetForm } from "../../hooks/useBudgetForms"
import type { BudgetFormData } from "../../schemas/budget.schema"
import { parseMoney } from "../../utils/money"
import { FormModalFooter } from "./FormModalFooter"

interface BudgetFormModalProps {
  open: boolean
  onClose: () => void
  budget: ProjectBudget | null
  isSubmitting: boolean
  onSubmit: (data: BudgetFormData) => Promise<unknown>
}

/** Criar ou editar o orçamento da obra. */
export function BudgetFormModal({ open, onClose, budget, isSubmitting, onSubmit }: BudgetFormModalProps) {
  const { t } = useTranslation()
  const { form, handleSave } = useBudgetForm(budget, onSubmit)
  const { errors } = form.formState

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={budget ? t("obra.orcamento.budgetForm.editTitle") : t("obra.orcamento.budgetForm.createTitle")}
      icon={<Coins size={18} />}
      size="sm"
      footer={<FormModalFooter isSubmitting={isSubmitting} onCancel={onClose} onSave={handleSave} />}
    >
      <form
        noValidate
        className="grid gap-4 px-6 pt-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <Field label={t("obra.orcamento.budgetForm.plannedTotal")} error={errors.plannedTotal?.message && t(errors.plannedTotal.message)}>
          {(id) => (
            <Input id={id} inputMode="decimal" placeholder="0,00" className="t-num" aria-invalid={!!errors.plannedTotal} {...form.register("plannedTotal", { setValueAs: parseMoney })} />
          )}
        </Field>
        <Field label={t("obra.orcamento.budgetForm.description")} error={errors.description?.message && t(errors.description.message)}>
          {(id) => <Input id={id} placeholder={t("obra.orcamento.budgetForm.descriptionPlaceholder")} {...form.register("description")} />}
        </Field>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
