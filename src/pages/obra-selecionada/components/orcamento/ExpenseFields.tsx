import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Select } from "@/shared/components/ui/select/Select"
import type { BudgetItem } from "@/shared/types/budget"

import type { ExpenseFormData } from "../../schemas/budget.schema"
import type { Stage } from "../../services/stages.service"
import { parseMoney } from "../../utils/money"

interface ExpenseFieldsProps {
  form: UseFormReturn<ExpenseFormData>
  items: BudgetItem[]
  stages: Stage[]
  /** Na edição a categoria não muda: o PATCH de despesa não move entre itens. */
  lockCategory: boolean
}

// Recebe também o valor inicial (`null`), não só o texto do <select>.
function toStage(value: string | number | null): number | null {
  return value === "" || value === null ? null : Number(value)
}

/** Campos da despesa: valor, descrição, categoria, etapa, fornecedor, data e comprovante. */
export function ExpenseFields({ form, items, stages, lockCategory }: ExpenseFieldsProps) {
  const { t } = useTranslation()
  const { errors } = form.formState

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <>
      <Field label={t("obra.orcamento.expenseForm.amount")} error={errorOf(errors.amount?.message)}>
        {(id) => (
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[18px] font-[600] text-meta">R$</span>
            <Input
              id={id}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              aria-invalid={!!errors.amount}
              className="t-num h-16 pl-14 text-[28px]"
              {...form.register("amount", { setValueAs: parseMoney })}
            />
          </div>
        )}
      </Field>

      <Field label={t("obra.orcamento.expenseForm.description")} error={errorOf(errors.description?.message)}>
        {(id) => (
          <Input id={id} placeholder={t("obra.orcamento.expenseForm.descriptionPlaceholder")} aria-invalid={!!errors.description} {...form.register("description")} />
        )}
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("obra.orcamento.itemForm.category")} error={errorOf(errors.itemId?.message)}>
          {(id) => (
            // Travada, a categoria não é registrada: o valor inicial segue no formulário
            // (campo desabilitado registrado some do submit do react-hook-form).
            <Select id={id} {...(lockCategory ? { disabled: true, defaultValue: form.getValues("itemId") } : form.register("itemId", { valueAsNumber: true }))}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.category}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.orcamento.expenseForm.stage")}>
          {(id) => (
            <Select id={id} {...form.register("stageId", { setValueAs: toStage })}>
              <option value="">{t("obra.orcamento.expenseForm.stageNone")}</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.orcamento.expenseForm.supplier")} error={errorOf(errors.supplier?.message)}>
          {(id) => <Input id={id} placeholder={t("obra.orcamento.expenseForm.supplierPlaceholder")} {...form.register("supplier")} />}
        </Field>
        <Field label={t("obra.orcamento.expenseForm.spentAt")} error={errorOf(errors.spentAt?.message)}>
          {(id) => <Input id={id} type="date" aria-invalid={!!errors.spentAt} {...form.register("spentAt")} />}
        </Field>
      </div>

      <Field label={t("obra.orcamento.expenseForm.receiptUrl")} error={errorOf(errors.receiptUrl?.message)}>
        {(id) => (
          <Input id={id} type="url" placeholder={t("obra.orcamento.expenseForm.receiptUrlPlaceholder")} aria-invalid={!!errors.receiptUrl} {...form.register("receiptUrl")} />
        )}
      </Field>
    </>
  )
}
