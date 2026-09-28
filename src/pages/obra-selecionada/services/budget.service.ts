import { api, buildHeaders } from "@/lib/api"
import type {
  BudgetItem,
  BudgetItemRequest,
  Expense,
  ExpenseRequest,
  ProjectBudget,
  ProjectBudgetRequest,
} from "@/shared/types/budget"

const BASE_URL = "/api"

/** Delegado ao api.ts: Authorization + X-Workspace-Id sempre juntos. */
function buildAuthHeader(): HeadersInit {
  return buildHeaders()
}

export async function getProjectBudget(projectId: number): Promise<ProjectBudget | null> {
  const response = await fetch(`${BASE_URL}/projects/${projectId}/budget`, {
    headers: buildAuthHeader(),
  })

  if (response.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/login"
    throw new Error("Sessão expirada. Faça login novamente.")
  }

  if (response.status === 404) return null

  if (!response.ok) {
    let message = `Erro ${response.status}`
    const text = await response.text()
    if (text) {
      try {
        const data = JSON.parse(text) as { message?: string }
        message = data.message ?? text
      } catch {
        message = text
      }
    }
    throw new Error(message)
  }

  return (await response.json()) as ProjectBudget
}

export async function createBudget(
  projectId: number,
  payload: ProjectBudgetRequest,
): Promise<ProjectBudget> {
  return api.post<ProjectBudget>(`/projects/${projectId}/budget`, payload)
}

export async function updateBudget(
  budgetId: number,
  payload: ProjectBudgetRequest,
): Promise<ProjectBudget> {
  return api.patch<ProjectBudget>(`/budgets/${budgetId}`, payload)
}

export async function deleteBudget(budgetId: number): Promise<void> {
  return api.delete<void>(`/budgets/${budgetId}`)
}

export async function createBudgetItem(
  budgetId: number,
  payload: BudgetItemRequest,
): Promise<BudgetItem> {
  return api.post<BudgetItem>(`/budgets/${budgetId}/items`, payload)
}

export async function updateBudgetItem(
  itemId: number,
  payload: BudgetItemRequest,
): Promise<BudgetItem> {
  return api.patch<BudgetItem>(`/budget-items/${itemId}`, payload)
}

export async function deleteBudgetItem(itemId: number): Promise<void> {
  return api.delete<void>(`/budget-items/${itemId}`)
}

export async function listExpenses(itemId: number): Promise<Expense[]> {
  return api.get<Expense[]>(`/budget-items/${itemId}/expenses`)
}

export async function createExpense(
  itemId: number,
  payload: ExpenseRequest,
): Promise<Expense> {
  return api.post<Expense>(`/budget-items/${itemId}/expenses`, payload)
}

export async function updateExpense(
  expenseId: number,
  payload: ExpenseRequest,
): Promise<Expense> {
  return api.patch<Expense>(`/expenses/${expenseId}`, payload)
}

export async function deleteExpense(expenseId: number): Promise<void> {
  return api.delete<void>(`/expenses/${expenseId}`)
}
