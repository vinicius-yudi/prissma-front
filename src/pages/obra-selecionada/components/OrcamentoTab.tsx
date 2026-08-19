import { useBudget } from "../hooks/useBudget"
import { useBudgetModals } from "../hooks/useBudgetModals"
import { useExpandedCategories } from "../hooks/useExpandedCategories"
import { useStagesList } from "../hooks/useStages"
import {
  toBudgetItemPayload,
  toBudgetPayload,
  toExpensePayload,
} from "../utils/budgetPayload"
import { BudgetCategoryList } from "./BudgetCategoryList"
import { BudgetCharts } from "./BudgetCharts"
import { BudgetDeleteConfirmModal } from "./BudgetDeleteConfirmModal"
import { BudgetEmptyState } from "./BudgetEmptyState"
import { BudgetErrorState } from "./BudgetErrorState"
import { BudgetFormModal } from "./BudgetFormModal"
import { BudgetItemFormModal } from "./BudgetItemFormModal"
import { BudgetLoadingState } from "./BudgetLoadingState"
import { BudgetMainPanel } from "./BudgetMainPanel"
import { ExpenseFormModal } from "./ExpenseFormModal"

interface OrcamentoTabProps {
  projectId: number
}

export function OrcamentoTab({ projectId }: OrcamentoTabProps) {
  const {
    budget,
    isLoading,
    isError,
    refetch,
    canMutate,
    isMutating,
    createBudget,
    updateBudget,
    deleteBudget,
    createItem,
    updateItem,
    deleteItem,
    createExpense,
    updateExpense,
    deleteExpense,
  } = useBudget(projectId)
  const { stages } = useStagesList(projectId)
  const {
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
  } = useBudgetModals()
  const { toggle, isExpanded } = useExpandedCategories()

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.kind === "budget") await deleteBudget(deleteTarget.id)
      else if (deleteTarget.kind === "item") await deleteItem(deleteTarget.id)
      else await deleteExpense(deleteTarget.id)
      closeDelete()
    } catch {
      /* toast handled in hook */
    }
  }

  if (isLoading) return <BudgetLoadingState />
  if (isError) return <BudgetErrorState onRetry={() => refetch()} />

  if (!budget) {
    return (
      <>
        <BudgetEmptyState canMutate={canMutate} onCreate={openBudgetForm} />
        <BudgetFormModal
          open={modal.kind === "budget"}
          onClose={closeModal}
          budget={null}
          onCreate={(form) => createBudget(toBudgetPayload(form))}
          onUpdate={(id, form) => updateBudget({ id, payload: toBudgetPayload(form) })}
          isSubmitting={isMutating}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <BudgetMainPanel
          budget={budget}
          canMutate={canMutate}
          onAddItem={() => openItemForm(null)}
          onEditBudget={openBudgetForm}
          onDeleteBudget={() => requestDeleteBudget(budget.id)}
        />

        <BudgetCharts items={budget.items} />

        <BudgetCategoryList
          items={budget.items}
          stages={stages}
          isExpanded={isExpanded}
          canMutate={canMutate}
          onToggle={toggle}
          onEditItem={(item) => openItemForm(item)}
          onDeleteItem={(item) => requestDeleteItem(item.id)}
          onAddExpense={(itemId) => openExpenseForm(itemId, null)}
          onEditExpense={(itemId, exp) => openExpenseForm(itemId, exp)}
          onDeleteExpense={(exp) => requestDeleteExpense(exp.id)}
        />
      </div>

      <BudgetFormModal
        open={modal.kind === "budget"}
        onClose={closeModal}
        budget={budget}
        onCreate={(form) => createBudget(toBudgetPayload(form))}
        onUpdate={(id, form) => updateBudget({ id, payload: toBudgetPayload(form) })}
        isSubmitting={isMutating}
      />

      <BudgetItemFormModal
        open={modal.kind === "item"}
        onClose={closeModal}
        item={modal.kind === "item" ? modal.item : null}
        onCreate={(form) => createItem({ budgetId: budget.id, payload: toBudgetItemPayload(form) })}
        onUpdate={(id, form) => updateItem({ id, payload: toBudgetItemPayload(form) })}
        isSubmitting={isMutating}
      />

      <ExpenseFormModal
        open={modal.kind === "expense"}
        onClose={closeModal}
        expense={modal.kind === "expense" ? modal.expense : null}
        stages={stages}
        onCreate={(form) =>
          modal.kind === "expense"
            ? createExpense({ itemId: modal.itemId, payload: toExpensePayload(form) })
            : Promise.resolve()
        }
        onUpdate={(id, form) => updateExpense({ id, payload: toExpensePayload(form) })}
        isSubmitting={isMutating}
      />

      <BudgetDeleteConfirmModal
        target={deleteTarget}
        isSubmitting={isMutating}
        onClose={closeDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
