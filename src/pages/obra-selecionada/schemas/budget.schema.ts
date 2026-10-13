import { z } from "zod"

/** Mensagens são chaves de i18n: a view faz `t(message)`. */
const E = "obra.orcamento.validation"

const moneyAmount = z
  .number(`${E}.amountRequired`)
  .nonnegative(`${E}.amountPositive`)
  .max(999_999_999_999.99, `${E}.amountTooHigh`)

export const budgetSchema = z.object({
  description: z.string().max(255, `${E}.tooLong`).optional(),
  plannedTotal: moneyAmount,
})

export type BudgetFormData = z.infer<typeof budgetSchema>

export const BUDGET_FORM_DEFAULTS: BudgetFormData = {
  description: "",
  plannedTotal: 0,
}

export const budgetItemSchema = z.object({
  category: z.string().trim().min(1, `${E}.categoryRequired`).max(100, `${E}.tooLong`),
  description: z.string().trim().min(1, `${E}.descriptionRequired`),
  plannedAmount: moneyAmount,
})

export type BudgetItemFormData = z.infer<typeof budgetItemSchema>

export const BUDGET_ITEM_FORM_DEFAULTS: BudgetItemFormData = {
  category: "",
  description: "",
  plannedAmount: 0,
}

export const expenseSchema = z.object({
  /** Categoria (item do orçamento) que recebe o lançamento. */
  itemId: z.number(`${E}.categoryRequired`).int().positive(`${E}.categoryRequired`),
  description: z.string().trim().min(1, `${E}.expenseDescriptionRequired`),
  amount: z
    .number(`${E}.amountRequired`)
    .gt(0, `${E}.amountAboveZero`)
    .max(999_999_999_999.99, `${E}.amountTooHigh`),
  spentAt: z
    .string()
    .min(1, `${E}.dateRequired`)
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${E}.dateInvalid`),
  stageId: z.number().int().positive().nullable(),
  supplier: z.string().max(255, `${E}.tooLong`).optional(),
  receiptUrl: z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\//i.test(val), `${E}.urlInvalid`),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>

export const EXPENSE_FORM_DEFAULTS: ExpenseFormData = {
  itemId: 0,
  description: "",
  amount: 0,
  spentAt: "",
  stageId: null,
  supplier: "",
  receiptUrl: "",
}
