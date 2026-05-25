import { zodResolver } from "@hookform/resolvers/zod"
import { Receipt } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"
import type { Expense } from "@/shared/types/budget"
import { todayIsoDate } from "@/shared/utils/formatters"

import {
  EXPENSE_FORM_DEFAULTS,
  expenseSchema,
  type ExpenseFormData,
} from "../schemas/budget.schema"
import type { Stage } from "../services/stages.service"

const formLabel = tv({
  base: "block text-xs uppercase tracking-widest text-primary font-semibold",
})

const formInput = tv({
  base: "bg-surface-container-highest text-on-surface [&_option]:bg-surface-container-highest focus:ring-1",
})

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  expense: Expense | null
  stages: Stage[]
  onCreate: (payload: ExpenseFormData) => Promise<unknown>
  onUpdate: (id: number, payload: ExpenseFormData) => Promise<unknown>
  isSubmitting: boolean
}

export function ExpenseFormModal({
  open,
  onClose,
  expense,
  stages,
  onCreate,
  onUpdate,
  isSubmitting,
}: ExpenseFormModalProps) {
  const { t } = useTranslation()
  const isEdit = !!expense

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: EXPENSE_FORM_DEFAULTS,
  })

  useEffect(() => {
    if (!open) return
    if (expense) {
      form.reset({
        description: expense.description,
        amount: expense.amount,
        spentAt: expense.spentAt,
        stageId: expense.stageId ?? null,
        supplier: expense.supplier ?? "",
        receiptUrl: expense.receiptUrl ?? "",
      })
    } else {
      form.reset({ ...EXPENSE_FORM_DEFAULTS, spentAt: todayIsoDate() })
    }
  }, [open, expense, form])

  async function onSubmit(data: ExpenseFormData) {
    try {
      if (isEdit && expense) {
        await onUpdate(expense.id, data)
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
          ? t("obra.orcamento.expenseForm.editTitle")
          : t("obra.orcamento.expenseForm.createTitle")
      }
      icon={<Receipt size={18} />}
      variant="default"
      size="xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="px-6 pt-5 pb-2 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.expenseForm.description")}
            </Label>
            <Input
              className={formInput()}
              placeholder={t("obra.orcamento.expenseForm.descriptionPlaceholder")}
              {...form.register("description")}
            />
            {errors.description && (
              <p className="text-xs text-error mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.expenseForm.amount")}
            </Label>
            <Input
              className={formInput()}
              type="number"
              step="0.01"
              min={0}
              {...form.register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-xs text-error mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.expenseForm.spentAt")}
            </Label>
            <Input
              className={formInput()}
              type="date"
              {...form.register("spentAt")}
            />
            {errors.spentAt && (
              <p className="text-xs text-error mt-1">{errors.spentAt.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.expenseForm.stage")}
            </Label>
            <Select
              className={formInput()}
              {...form.register("stageId", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            >
              <option value="">{t("obra.orcamento.expenseForm.stageNone")}</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.expenseForm.supplier")}
            </Label>
            <Input
              className={formInput()}
              placeholder={t("obra.orcamento.expenseForm.supplierPlaceholder")}
              {...form.register("supplier")}
            />
            {errors.supplier && (
              <p className="text-xs text-error mt-1">{errors.supplier.message}</p>
            )}
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label className={formLabel()}>
              {t("obra.orcamento.expenseForm.receiptUrl")}
            </Label>
            <Input
              className={formInput()}
              type="url"
              placeholder={t("obra.orcamento.expenseForm.receiptUrlPlaceholder")}
              {...form.register("receiptUrl")}
            />
            {errors.receiptUrl && (
              <p className="text-xs text-error mt-1">{errors.receiptUrl.message}</p>
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
