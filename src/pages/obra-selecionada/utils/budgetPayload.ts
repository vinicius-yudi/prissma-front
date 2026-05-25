import type {
  BudgetItemRequest,
  ExpenseRequest,
  ProjectBudgetRequest,
} from "@/shared/types/budget"

import type {
  BudgetFormData,
  BudgetItemFormData,
  ExpenseFormData,
} from "../schemas/budget.schema"

function nullIfEmpty(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null
}

export function toBudgetPayload(form: BudgetFormData): ProjectBudgetRequest {
  return {
    description: nullIfEmpty(form.description),
    plannedTotal: form.plannedTotal,
  }
}

export function toBudgetItemPayload(form: BudgetItemFormData): BudgetItemRequest {
  return {
    category: form.category,
    description: form.description,
    plannedAmount: form.plannedAmount,
  }
}

export function toExpensePayload(form: ExpenseFormData): ExpenseRequest {
  return {
    description: form.description,
    amount: form.amount,
    spentAt: form.spentAt,
    stageId: form.stageId ?? null,
    supplier: nullIfEmpty(form.supplier),
    receiptUrl: nullIfEmpty(form.receiptUrl),
  }
}
