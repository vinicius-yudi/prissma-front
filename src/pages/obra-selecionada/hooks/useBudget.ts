import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { useUndoableDelete } from "@/shared/hooks/useUndoableDelete"

import type {
  BudgetItemRequest,
  Expense,
  ExpenseRequest,
  ProjectBudget,
  ProjectBudgetRequest,
} from "@/shared/types/budget"

import {
  createBudget,
  createBudgetItem,
  createExpense,
  deleteBudget,
  deleteBudgetItem,
  deleteExpense,
  getProjectBudget,
  updateBudget,
  updateBudgetItem,
  updateExpense,
} from "../services/budget.service"
import { ProjectPermission } from "../services/projectPermissions.service"
import { useProjectPermissions } from "./useProjectPermissions"

export function useBudget(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ["budget", projectId]
  const isValid = projectId > 0

  const { can } = useProjectPermissions(projectId)

  const canMutate = can(ProjectPermission.MANAGE_BUDGET)

  const query = useQuery({
    queryKey,
    queryFn: () => getProjectBudget(projectId),
    enabled: isValid,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
  }

  function notifyExceeded(expense: Expense) {
    if (expense.categoryExceeded) {
      toast.warning(t("obra.orcamento.toasts.categoryExceededWarning"))
    }
    if (expense.budgetExceeded) {
      toast.warning(t("obra.orcamento.toasts.budgetExceededWarning"))
    }
  }

  const createBudgetMutation = useMutation({
    mutationFn: (payload: ProjectBudgetRequest) => createBudget(projectId, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.budgetCreated"))
    },
    onError: (error: Error) => {
      if (error.message?.toLowerCase().includes("already")) {
        toast.error(t("obra.orcamento.toasts.alreadyExists"))
        invalidate()
        return
      }
      toast.error(error.message || t("obra.orcamento.errors.saveFailed"))
    },
  })

  const updateBudgetMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectBudgetRequest }) =>
      updateBudget(id, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.budgetUpdated"))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: number) => deleteBudget(id),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.budgetDeleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const createItemMutation = useMutation({
    mutationFn: ({ budgetId, payload }: { budgetId: number; payload: BudgetItemRequest }) =>
      createBudgetItem(budgetId, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.itemCreated"))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BudgetItemRequest }) =>
      updateBudgetItem(id, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.itemUpdated"))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => deleteBudgetItem(id),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.itemDeleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const createExpenseMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: ExpenseRequest }) =>
      createExpense(itemId, payload),
    onSuccess: (expense) => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.expenseCreated"))
      notifyExceeded(expense)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExpenseRequest }) =>
      updateExpense(id, payload),
    onSuccess: (expense) => {
      invalidate()
      toast.success(t("obra.orcamento.toasts.expenseUpdated"))
      notifyExceeded(expense)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Despesa some na hora e vai ao servidor depois da janela do Desfazer.
  const removeExpense = useUndoableDelete<Expense, Expense[]>({
    queryKey: () => ["budget", projectId, "expenses", query.data?.id ?? null],
    removeFrom: (list, expense) => list.filter((e) => e.id !== expense.id),
    commit: (expense) => deleteExpense(expense.id),
    alsoInvalidate: () => [queryKey],
    describe: (expense) => ({ title: t("obra.orcamento.toasts.expenseDeleted"), body: expense.description }),
    errorMessage: t("obra.orcamento.toasts.expenseDeleteError"),
  })

  const isMutating =
    createBudgetMutation.isPending ||
    updateBudgetMutation.isPending ||
    deleteBudgetMutation.isPending ||
    createItemMutation.isPending ||
    updateItemMutation.isPending ||
    deleteItemMutation.isPending ||
    createExpenseMutation.isPending ||
    updateExpenseMutation.isPending

  return {
    budget: query.data ?? null as ProjectBudget | null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    canMutate,
    isMutating,

    createBudget: createBudgetMutation.mutateAsync,
    updateBudget: updateBudgetMutation.mutateAsync,
    deleteBudget: deleteBudgetMutation.mutateAsync,

    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,

    createExpense: createExpenseMutation.mutateAsync,
    updateExpense: updateExpenseMutation.mutateAsync,
    removeExpense,
  }
}
