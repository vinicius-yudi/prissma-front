import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import type { BudgetItem, Expense } from "@/shared/types/budget"
import { todayIsoDate } from "@/shared/utils/formatters"

import { EXPENSE_FORM_DEFAULTS, expenseSchema, type ExpenseFormData } from "../schemas/budget.schema"

export interface ExpenseImpact {
  item: BudgetItem
  /** % gasto hoje e depois do lançamento. */
  beforePercent: number
  afterPercent: number
  /** Saldo da categoria depois (negativo = estoura). */
  remainingAfter: number
  willExceed: boolean
}

interface UseExpenseFormArgs {
  items: BudgetItem[]
  /** Lançamento em edição; `null` cria. */
  expense: Expense | null
  /** Categoria sugerida ao criar (a filtrada, ou a primeira). */
  defaultItemId: number | null
  onSubmit: (data: ExpenseFormData) => Promise<unknown>
}

export interface UseExpenseFormResult {
  form: UseFormReturn<ExpenseFormData>
  impact: ExpenseImpact | null
  handleSave: () => void
}

function valuesFrom(expense: Expense): ExpenseFormData {
  return {
    itemId: expense.budgetItemId,
    description: expense.description,
    amount: expense.amount,
    spentAt: expense.spentAt.slice(0, 10),
    stageId: expense.stageId ?? null,
    supplier: expense.supplier ?? "",
    receiptUrl: expense.receiptUrl ?? "",
  }
}

function percentOf(value: number, planned: number): number {
  return planned > 0 ? (value / planned) * 100 : 0
}

/**
 * Formulário de despesa com a prévia ao vivo da categoria: quanto ela passa a
 * ter gasto e se vai estourar — é o que troca o botão para "Lançar mesmo
 * assim". Valores iniciais no mount (quem abre troca a `key`).
 */
export function useExpenseForm({ items, expense, defaultItemId, onSubmit }: UseExpenseFormArgs): UseExpenseFormResult {
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? valuesFrom(expense)
      : { ...EXPENSE_FORM_DEFAULTS, itemId: defaultItemId ?? items[0]?.id ?? 0, spentAt: todayIsoDate() },
  })
  const [itemId, amount] = useWatch({ control: form.control, name: ["itemId", "amount"] })
  const item = items.find((candidate) => candidate.id === itemId) ?? null
  const typed = Number.isFinite(amount) && amount > 0 ? amount : 0

  // Na edição o valor antigo já está no gasto da categoria: sai antes de somar.
  const base = item && expense && expense.budgetItemId === item.id ? item.totalSpent - expense.amount : (item?.totalSpent ?? 0)
  const impact: ExpenseImpact | null = item
    ? {
        item,
        beforePercent: percentOf(base, item.plannedAmount),
        afterPercent: percentOf(base + typed, item.plannedAmount),
        remainingAfter: item.plannedAmount - base - typed,
        willExceed: typed > 0 && base + typed > item.plannedAmount,
      }
    : null

  async function save(data: ExpenseFormData) {
    try {
      await onSubmit(data)
    } catch {
      // O toast de erro sai do hook de mutation; o modal fica aberto.
    }
  }

  return { form, impact, handleSave: () => void form.handleSubmit(save)() }
}
