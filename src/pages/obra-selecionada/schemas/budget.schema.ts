import { z } from "zod"

const moneyAmount = z
  .number({ message: "Valor obrigatório" })
  .nonnegative("Valor deve ser positivo")
  .max(999_999_999_999.99, "Valor acima do limite")

export const budgetSchema = z.object({
  description: z.string().max(255, "Máximo 255 caracteres").optional(),
  plannedTotal: moneyAmount,
})

export type BudgetFormData = z.infer<typeof budgetSchema>

export const BUDGET_FORM_DEFAULTS: BudgetFormData = {
  description: "",
  plannedTotal: 0,
}

export const budgetItemSchema = z.object({
  category: z
    .string()
    .min(1, "Categoria obrigatória")
    .max(100, "Máximo 100 caracteres"),
  description: z.string().min(1, "Descrição obrigatória"),
  plannedAmount: moneyAmount,
})

export type BudgetItemFormData = z.infer<typeof budgetItemSchema>

export const BUDGET_ITEM_FORM_DEFAULTS: BudgetItemFormData = {
  category: "",
  description: "",
  plannedAmount: 0,
}

export const expenseSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z
    .number({ message: "Valor obrigatório" })
    .gt(0, "Valor deve ser maior que zero")
    .max(999_999_999_999.99, "Valor acima do limite"),
  spentAt: z
    .string()
    .min(1, "Data obrigatória")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  stageId: z.number().int().positive().nullable(),
  supplier: z.string().max(255, "Máximo 255 caracteres").optional(),
  receiptUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\//i.test(val),
      "URL deve começar com http:// ou https://",
    ),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

export const EXPENSE_FORM_DEFAULTS: ExpenseFormData = {
  description: "",
  amount: 0,
  spentAt: "",
  stageId: null,
  supplier: "",
  receiptUrl: "",
}
