import type { TarefaPriority, TarefaStatus } from "@/pages/obra-selecionada/types/tarefas"

// Resposta de GET /users/me/tasks — formato distinto de Tarefa (usa projectId,
// stageName, assigneeRole, completedAt).
export interface MyTask {
  id: number
  stageId: number
  projectId: number
  stageName: string
  assigneeUserId: number | null
  assigneeName: string | null
  assigneeRole: string | null
  title: string
  description: string
  priority: TarefaPriority
  status: TarefaStatus
  plannedStartDate: string
  plannedEndDate: string
  completedAt: string | null
}

export interface DashboardTask extends MyTask {
  projectTitle: string | null
}
