import { zodResolver } from "@hookform/resolvers/zod"
import { Folder } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { BudgetItem } from "@/shared/types/budget"

import {
  BUDGET_ITEM_FORM_DEFAULTS,
  budgetItemSchema,
  type BudgetItemFormData,
} from "../schemas/budget.schema"

const formLabel = tv({
  base: "block text-xs uppercase tracking-widest text-primary font-semibold",
})

const formInput = tv({
  base: "bg-surface-container-highest text-on-surface focus:ring-1",
})

interface BudgetItemFormModalProps {
  open: boolean
  onClose: () => void
  item: BudgetItem | null
  onCreate: (payload: BudgetItemFormData) => Promise<unknown>
  onUpdate: (id: number, payload: BudgetItemFormData) => Promise<unknown>
  isSubmitting: boolean
}

export function BudgetItemFormModal({
  open,
  onClose,
  item,
  onCreate,
  onUpdate,
  isSubmitting,
}: BudgetItemFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!item

  const form = useForm<BudgetItemFormData>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: BUDGET_ITEM_FORM_DEFAULTS,
  })

  useEffect(() => {
    if (!open) return
    if (item) {
      form.reset({
        category: item.category,
        description: item.description,
        plannedAmount: item.plannedAmount,
      })
    } else {
      form.reset(BUDGET_ITEM_FORM_DEFAULTS)
    }
  }, [open, item, form])

  async function onSubmit(data: BudgetItemFormData) {
    try {
      if (isEdit && item) {
        await onUpdate(item.id, data)
      } else {
        await onCreate(data)
      }
      onClose()
    } catch {
      /* toast handled in hook */
    }
  }

  const errors = form.formState.errors

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? t("obra.orcamento.itemForm.editTitle")
          : t("obra.orcamento.itemForm.createTitle")
      }
      icon={<Folder size={18} />}
      variant="default"
      size="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="px-6 pt-5 pb-2 space-y-5">
          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.itemForm.category")}
            </Label>
            <Input
              className={formInput()}
              placeholder={t("obra.orcamento.itemForm.categoryPlaceholder")}
              {...form.register("category")}
            />
            {errors.category && (
              <p className="text-xs text-error mt-1">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.itemForm.description")}
            </Label>
            <textarea
              rows={3}
              className="w-full rounded-xl px-4 py-3 bg-surface-container-highest text-on-surface text-sm border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder={t("obra.orcamento.itemForm.descriptionPlaceholder")}
              {...form.register("description")}
            />
            {errors.description && (
              <p className="text-xs text-error mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.itemForm.plannedAmount")}
            </Label>
            <Input
              className={formInput()}
              type="number"
              step="0.01"
              min={0}
              {...form.register("plannedAmount", { valueAsNumber: true })}
            />
            {errors.plannedAmount && (
              <p className="text-xs text-error mt-1">{errors.plannedAmount.message}</p>
            )}
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
