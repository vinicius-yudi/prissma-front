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
  /** Preenchido pelo backend quando a tarefa vai para DONE. */
  completedAt: string | null
}

export interface CreateTarefaRequest {
  title: string
  description?: string
  priority: TarefaPriority
  status: TarefaStatus
  plannedStartDate: string
  plannedEndDate: string
  /** Opcional: tarefa pode nascer sem responsável. */
  assigneeUserId?: number | null
}

export interface UpdateTarefaRequest {
  title?: string
  description?: string
  priority?: TarefaPriority
  status?: TarefaStatus
  plannedStartDate?: string
  plannedEndDate?: string
  assigneeUserId?: number
}

/**
 * Tarefa com a etapa de origem.
 *
 * As tarefas pendem de etapas no backend (`/stages/{id}/tasks`), então o
 * kanban — que agrupa por status e não por etapa — precisa carregar de qual
 * coleção cada card veio para saber onde aplicar o `PATCH`.
 */
export interface TarefaComEtapa {
  tarefa: Tarefa
  stageId: number
  stageName: string
}
