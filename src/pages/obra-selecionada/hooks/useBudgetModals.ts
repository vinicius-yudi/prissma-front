import { useCallback, useState } from "react"

import type { BudgetItem, Expense } from "@/shared/types/budget"

export type BudgetModalState =
  | { kind: "closed" }
  | { kind: "budget" }
  | { kind: "item"; item: BudgetItem | null }
  | { kind: "expense"; itemId: number; expense: Expense | null }

export type BudgetDeleteTarget =
  | { kind: "budget"; id: number }
  | { kind: "item"; id: number }
  | { kind: "expense"; id: number }

export function useBudgetModals() {
  const [modal, setModal] = useState<BudgetModalState>({ kind: "closed" })
  const [deleteTarget, setDeleteTarget] = useState<BudgetDeleteTarget | null>(null)

  const closeModal = useCallback(() => setModal({ kind: "closed" }), [])
  const closeDelete = useCallback(() => setDeleteTarget(null), [])

  const openBudgetForm = useCallback(() => setModal({ kind: "budget" }), [])
  const openItemForm = useCallback(
    (item: BudgetItem | null = null) => setModal({ kind: "item", item }),
    [],
  )
  const openExpenseForm = useCallback(
    (itemId: number, expense: Expense | null = null) =>
      setModal({ kind: "expense", itemId, expense }),
    [],
  )

  const requestDeleteBudget = useCallback(
    (id: number) => setDeleteTarget({ kind: "budget", id }),
    [],
  )
  const requestDeleteItem = useCallback(
    (id: number) => setDeleteTarget({ kind: "item", id }),
    [],
  )
  const requestDeleteExpense = useCallback(
    (id: number) => setDeleteTarget({ kind: "expense", id }),
    [],
  )

  return {
    modal,
    deleteTarget,
    closeModal,
    closeDelete,
    openBudgetForm,
    openItemForm,
    openExpenseForm,
    requestDeleteBudget,
    requestDeleteItem,
    requestDeleteExpense,
  }
}
