import type { ProjectStatus } from "@/shared/types/project"

export const ProjectFilter = {
  ALL: "ALL",
  IN_PROGRESS: "IN_PROGRESS",
  PLANNING: "PLANNING",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
} as const

export type ProjectFilter = (typeof ProjectFilter)[keyof typeof ProjectFilter]

export const ProjectSort = {
  RECENT: "recentes",
  DEADLINE: "prazo",
  NAME: "nome",
} as const

export type ProjectSort = (typeof ProjectSort)[keyof typeof ProjectSort]

export const ProjectView = {
  GRID: "grade",
  LIST: "lista",
} as const

export type ProjectView = (typeof ProjectView)[keyof typeof ProjectView]

export const EtapaStatus = {
  PLANNED: "PLANNED",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE",
} as const

export type EtapaStatus = (typeof EtapaStatus)[keyof typeof EtapaStatus]

export const TarefaStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE",
} as const

export type TarefaStatus = (typeof TarefaStatus)[keyof typeof TarefaStatus]

export const TarefaPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const

export type TarefaPriority = (typeof TarefaPriority)[keyof typeof TarefaPriority]

/** Contagem de tarefas por status, como o backend devolve. */
export type TaskStatusCounts = Partial<Record<TarefaStatus, number>>

/**
 * Etapa no acompanhamento (`AcompanhamentoStageResponse`). O backend não
 * manda a lista de tarefas aqui — só o total e a contagem por status.
 */
export interface AcompanhamentoEtapa {
  id: number
  name: string
  description: string | null
  displayOrder: number
  status: EtapaStatus
  plannedStartDate: string | null
  plannedEndDate: string | null
  totalTarefas: number
  taskStatusCounts: TaskStatusCounts
}

/** `GET /projects/{id}/acompanhamento` (`AcompanhamentoResponse`). */
export interface ProjetoAcompanhamento {
  obraId: number
  titulo: string
  status: ProjectStatus
  totalEtapas: number
  etapasConcluidas: number
  totalTarefas: number
  tarefasConcluidas: number
  stageStatusCounts: Partial<Record<EtapaStatus, number>>
  taskStatusCounts: TaskStatusCounts
  etapas: AcompanhamentoEtapa[]
}
