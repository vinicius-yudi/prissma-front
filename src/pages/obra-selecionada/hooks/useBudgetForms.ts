import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import type { FieldValues, UseFormReturn } from "react-hook-form"

import type { BudgetItem, ProjectBudget } from "@/shared/types/budget"

import {
  BUDGET_FORM_DEFAULTS,
  BUDGET_ITEM_FORM_DEFAULTS,
  budgetItemSchema,
  budgetSchema,
  type BudgetFormData,
  type BudgetItemFormData,
} from "../schemas/budget.schema"

export interface SimpleFormResult<T extends FieldValues> {
  form: UseFormReturn<T>
  handleSave: () => void
}

/** Envia e engole o erro: o toast sai do hook de mutation e o modal fica aberto. */
function submitter<T extends FieldValues>(form: UseFormReturn<T>, onSubmit: (data: T) => Promise<unknown>) {
  return () =>
    void form.handleSubmit(async (data) => {
      try {
        await onSubmit(data)
      } catch {
        // Tratado no hook de mutation.
      }
    })()
}

/** Orçamento da obra: valor total e descrição. Valores iniciais no mount. */
export function useBudgetForm(budget: ProjectBudget | null, onSubmit: (data: BudgetFormData) => Promise<unknown>): SimpleFormResult<BudgetFormData> {
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget ? { description: budget.description ?? "", plannedTotal: budget.plannedTotal } : BUDGET_FORM_DEFAULTS,
  })
  return { form, handleSave: submitter(form, onSubmit) }
}

/** Categoria do orçamento: nome, descrição e valor planejado. */
export function useCategoryForm(item: BudgetItem | null, onSubmit: (data: BudgetItemFormData) => Promise<unknown>): SimpleFormResult<BudgetItemFormData> {
  const form = useForm<BudgetItemFormData>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: item ? { category: item.category, description: item.description, plannedAmount: item.plannedAmount } : BUDGET_ITEM_FORM_DEFAULTS,
  })
  return { form, handleSave: submitter(form, onSubmit) }
}
