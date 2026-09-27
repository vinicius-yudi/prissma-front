import type { ProjectBudget } from "@/shared/types/budget"

import type { useBudget } from "../../hooks/useBudget"
import type { useBudgetModals } from "../../hooks/useBudgetModals"
import type { ExpenseFormData } from "../../schemas/budget.schema"
import type { Stage } from "../../services/stages.service"
import { toBudgetItemPayload, toBudgetPayload, toExpensePayload } from "../../utils/budgetPayload"
import { BudgetDeleteModal } from "./BudgetDeleteModal"
import { BudgetFormModal } from "./BudgetFormModal"
import { CategoryFormModal } from "./CategoryFormModal"
import { ExpenseModal } from "./ExpenseModal"

interface BudgetModalsProps {
  ops: ReturnType<typeof useBudget>
  modals: ReturnType<typeof useBudgetModals>
  budget: ProjectBudget | null
  stages: Stage[]
  /** Categoria filtrada — sugestão ao lançar despesa. */
  selectedItemId: number | null
}

/** Os modais do orçamento, ligados às mutations. Cada um fecha ao salvar. */
export function BudgetModals({ ops, modals, budget, stages, selectedItemId }: BudgetModalsProps) {
  const { modal, closeModal, deleteTarget, closeDelete } = modals

  async function afterSave(action: Promise<unknown>) {
    await action
    closeModal()
  }

  function saveExpense(data: ExpenseFormData) {
    const payload = toExpensePayload(data)
    const editing = modal.kind === "expense" ? modal.expense : null
    return afterSave(editing ? ops.updateExpense({ id: editing.id, payload }) : ops.createExpense({ itemId: data.itemId, payload }))
  }

  const deleteByKind = {
    budget: (id: number) => ops.deleteBudget(id),
    item: (id: number) => ops.deleteItem(id),
    expense: (id: number) => ops.deleteExpense(id),
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteByKind[deleteTarget.kind](deleteTarget.id).then(closeDelete, () => undefined)
  }

  return (
    <>
      <BudgetFormModal
        key={`budget-${modals.key}`}
        open={modal.kind === "budget"}
        onClose={closeModal}
        budget={budget}
        isSubmitting={ops.isMutating}
        onSubmit={(data) =>
          afterSave(budget ? ops.updateBudget({ id: budget.id, payload: toBudgetPayload(data) }) : ops.createBudget(toBudgetPayload(data)))
        }
      />
      {budget && (
        <>
          <CategoryFormModal
            key={`item-${modals.key}`}
            open={modal.kind === "item"}
            onClose={closeModal}
            item={modal.kind === "item" ? modal.item : null}
            isSubmitting={ops.isMutating}
            onSubmit={(data) => {
              const editing = modal.kind === "item" ? modal.item : null
              const payload = toBudgetItemPayload(data)
              return afterSave(editing ? ops.updateItem({ id: editing.id, payload }) : ops.createItem({ budgetId: budget.id, payload }))
            }}
          />
          <ExpenseModal
            key={`expense-${modals.key}`}
            open={modal.kind === "expense"}
            onClose={closeModal}
            items={budget.items}
            stages={stages}
            expense={modal.kind === "expense" ? modal.expense : null}
            defaultItemId={selectedItemId}
            isSubmitting={ops.isMutating}
            onSubmit={saveExpense}
          />
        </>
      )}
      <BudgetDeleteModal target={deleteTarget} isSubmitting={ops.isMutating} onClose={closeDelete} onConfirm={confirmDelete} />
    </>
  )
}
