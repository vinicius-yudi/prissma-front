import { useState } from "react"

import type { BudgetItem, Expense } from "@/shared/types/budget"

export type BudgetModalState =
  | { kind: "closed" }
  | { kind: "budget" }
  | { kind: "item"; item: BudgetItem | null }
  | { kind: "expense"; expense: Expense | null }

export type BudgetDeleteTarget =
  | { kind: "budget"; id: number }
  | { kind: "item"; id: number; name: string }
  | { kind: "expense"; id: number; name: string }

/**
 * Qual modal do orçamento está aberto. `key` muda a cada abertura: o
 * formulário remonta e lê os valores iniciais sem effect de reset.
 */
export function useBudgetModals() {
  const [modal, setModal] = useState<BudgetModalState>({ kind: "closed" })
  const [key, setKey] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<BudgetDeleteTarget | null>(null)

  function open(next: BudgetModalState) {
    setKey((k) => k + 1)
    setModal(next)
  }

  return {
    modal,
    key,
    deleteTarget,
    closeModal: () => setModal({ kind: "closed" }),
    closeDelete: () => setDeleteTarget(null),
    openBudgetForm: () => open({ kind: "budget" }),
    openItemForm: (item: BudgetItem | null = null) => open({ kind: "item", item }),
    openExpenseForm: (expense: Expense | null = null) => open({ kind: "expense", expense }),
    requestDelete: setDeleteTarget,
  }
}
