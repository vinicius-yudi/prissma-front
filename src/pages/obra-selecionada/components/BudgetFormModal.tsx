import { zodResolver } from "@hookform/resolvers/zod"
import { Coins } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { ProjectBudget } from "@/shared/types/budget"
import { getFirstFormErrorMessage } from "@/shared/utils/formValidation"

import {
  BUDGET_FORM_DEFAULTS,
  budgetSchema,
  type BudgetFormData,
} from "../schemas/budget.schema"

const formLabel = tv({
  base: "block text-xs uppercase tracking-widest text-primary font-semibold",
})

const formInput = tv({
  base: "bg-surface-container-highest text-on-surface focus:ring-1",
})

interface BudgetFormModalProps {
  open: boolean
  onClose: () => void
  budget: ProjectBudget | null
  onCreate: (payload: BudgetFormData) => Promise<unknown>
  onUpdate: (id: number, payload: BudgetFormData) => Promise<unknown>
  isSubmitting: boolean
}

export function BudgetFormModal({
  open,
  onClose,
  budget,
  onCreate,
  onUpdate,
  isSubmitting,
}: BudgetFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!budget

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: BUDGET_FORM_DEFAULTS,
  })

  useEffect(() => {
    if (!open) return
    if (budget) {
      form.reset({
        description: budget.description ?? "",
        plannedTotal: budget.plannedTotal,
      })
    } else {
      form.reset(BUDGET_FORM_DEFAULTS)
    }
  }, [open, budget, form])

  async function onSubmit(data: BudgetFormData) {
    try {
      if (isEdit && budget) {
        await onUpdate(budget.id, data)
      } else {
        await onCreate(data)
      }
      onClose()
    } catch {
      /* toast handled in hook */
    }
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const message = getFirstFormErrorMessage(errors)
    if (message) toast.error(message)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t("obra.orcamento.budgetForm.editTitle")
          : t("obra.orcamento.budgetForm.createTitle")
      }
      icon={<Coins size={18} />}
      variant="default"
      size="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
        <div className="px-6 pt-5 pb-2 space-y-5">
          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.budgetForm.description")}
            </Label>
            <Input
              className={formInput()}
              placeholder={t("obra.orcamento.budgetForm.descriptionPlaceholder")}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.budgetForm.plannedTotal")}
            </Label>
            <Input
              className={formInput()}
              type="number"
              step="0.01"
              min={0}
              {...form.register("plannedTotal", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mx-6 mt-5 mb-6 pt-5 border-t border-outline-variant">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-auto px-4"
          >
            {t("obra.orcamento.actions.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-auto px-4">
            {isSubmitting
              ? t("obra.orcamento.actions.saving")
              : t("obra.orcamento.actions.save")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
