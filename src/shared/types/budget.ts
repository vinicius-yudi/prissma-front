export interface ProjectBudget {
  id: number
  constructionProjectId: number
  description: string | null
  plannedTotal: number
  totalSpent: number
  remaining: number
  exceeded: boolean
  createdAt: string
  updatedAt: string
  items: BudgetItem[]
}

export interface BudgetItem {
  id: number
  projectBudgetId: number
  category: string
  description: string
  plannedAmount: number
  totalSpent: number
  remaining: number
  exceeded: boolean
}

export interface Expense {
  id: number
  budgetItemId: number
  stageId: number | null
  description: string
  amount: number
  supplier: string | null
  receiptUrl: string | null
  spentAt: string
  createdAt: string
  categoryExceeded: boolean
  budgetExceeded: boolean
}

export interface ProjectBudgetRequest {
  description?: string | null
  plannedTotal?: number
}

export interface BudgetItemRequest {
  category?: string
  description?: string
  plannedAmount?: number
}

export interface ExpenseRequest {
  stageId?: number | null
  description?: string
  amount?: number
  supplier?: string | null
  receiptUrl?: string | null
  spentAt?: string
}
