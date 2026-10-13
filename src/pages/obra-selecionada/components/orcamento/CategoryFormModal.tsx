import { Folder } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"
import type { BudgetItem } from "@/shared/types/budget"

import { useCategoryForm } from "../../hooks/useBudgetForms"
import type { BudgetItemFormData } from "../../schemas/budget.schema"
import { parseMoney } from "../../utils/money"
import { FormModalFooter } from "./FormModalFooter"

interface CategoryFormModalProps {
  open: boolean
  onClose: () => void
  item: BudgetItem | null
  isSubmitting: boolean
  onSubmit: (data: BudgetItemFormData) => Promise<unknown>
}

/** Criar ou editar uma categoria do orçamento. */
export function CategoryFormModal({ open, onClose, item, isSubmitting, onSubmit }: CategoryFormModalProps) {
  const { t } = useTranslation()
  const { form, handleSave } = useCategoryForm(item, onSubmit)
  const { errors } = form.formState

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={item ? t("obra.orcamento.itemForm.editTitle") : t("obra.orcamento.itemForm.createTitle")}
      icon={<Folder size={18} />}
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
        <Field label={t("obra.orcamento.itemForm.category")} error={errorOf(errors.category?.message)}>
          {(id) => <Input id={id} placeholder={t("obra.orcamento.itemForm.categoryPlaceholder")} aria-invalid={!!errors.category} {...form.register("category")} />}
        </Field>
        <Field label={t("obra.orcamento.itemForm.plannedAmount")} error={errorOf(errors.plannedAmount?.message)}>
          {(id) => (
            <Input id={id} inputMode="decimal" placeholder="0,00" className="t-num" aria-invalid={!!errors.plannedAmount} {...form.register("plannedAmount", { setValueAs: parseMoney })} />
          )}
        </Field>
        <Field label={t("obra.orcamento.itemForm.description")} error={errorOf(errors.description?.message)}>
          {(id) => (
            <Textarea id={id} rows={3} placeholder={t("obra.orcamento.itemForm.descriptionPlaceholder")} aria-invalid={!!errors.description} {...form.register("description")} />
          )}
        </Field>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
