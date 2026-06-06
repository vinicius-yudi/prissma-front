export type TarefaStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE'
export type TarefaPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Tarefa {
  id: number
  title: string
  description: string
  priority: TarefaPriority
  status: TarefaStatus
  plannedStartDate: string
  plannedEndDate: string
  assigneeUserId: number | null
  assigneeName: string | null
  constructionProjectId: number
  createdAt: string
  updatedAt: string
}

export interface CreateTarefaRequest {
  title: string
  description: string
  priority: TarefaPriority
  status: TarefaStatus
  plannedStartDate: string
  plannedEndDate: string
  assigneeUserId?: number | null
}

export interface UpdateTarefaRequest {
  title?: string
  description?: string
  priority?: TarefaPriority
  status?: TarefaStatus
  plannedStartDate?: string
  plannedEndDate?: string
  assigneeUserId?: number | null
}
