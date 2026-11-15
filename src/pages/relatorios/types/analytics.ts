/**
 * Contrato de `/analytics/*` — espelho dos records de `AnalyticsDtos` do
 * backend. Valor monetário chega como `number` (BigDecimal serializado) e
 * data pura como `"yyyy-MM-dd"`.
 *
 * Percentual e média vêm `null` quando o divisor é zero (obra sem orçamento,
 * sem etapas, sem etapa concluída na janela): a tela mostra "—", nunca 0%.
 */

export interface AnalyticsProjectOption {
  projectId: number
  projectTitle: string
  projectStatus: string
}

export interface AnalyticsSummary {
  budgetPlanned: number
  budgetExecuted: number
  budgetConsumedPct: number | null
  totalStages: number
  doneStages: number
  completionPct: number | null
  totalTasks: number
  doneTasks: number
  overdueTasks: number
  /** Desvio médio, em dias, das etapas concluídas nos últimos 30 dias. */
  avgDeviationDays30d: number | null
}

export interface BudgetMonthPoint {
  /** Primeiro dia do mês. */
  month: string
  plannedAmount: number
  executedAmount: number
  plannedCumulative: number
  executedCumulative: number
}

export interface ExpenseCategoryLine {
  category: string
  plannedAmount: number
  executedAmount: number
  exceeded: boolean
}

export interface BurndownPoint {
  /** Segunda-feira da semana. */
  week: string
  totalTasks: number
  plannedRemaining: number
  /** `null` em semana futura: a linha real para no presente. */
  actualRemaining: number | null
}

export interface OverdueStageLine {
  stageId: number
  projectId: number
  projectTitle: string
  stageName: string
  /** Cru do banco: PLANNED, IN_PROGRESS ou BLOCKED. */
  stageStatus: string
  plannedEndDate: string
  daysLate: number
}

/** Grão obra × usuário: no consolidado o mesmo membro aparece uma vez por obra. */
export interface MemberEffortLine {
  projectId: number
  userId: number
  userName: string
  roleInProject: string
  assignedTasks: number
  doneTasks: number
  overdueTasks: number
}

export interface AnalyticsDashboard {
  /** Hora da última carga do data warehouse (ISO com fuso). */
  lastRefreshAt: string | null
  summary: AnalyticsSummary
  budgetMonthly: BudgetMonthPoint[]
  expensesByCategory: ExpenseCategoryLine[]
  burndown: BurndownPoint[]
  overdueStages: OverdueStageLine[]
  memberEffort: MemberEffortLine[]
}
