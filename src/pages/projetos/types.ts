import type { ProjectStatus } from "@/shared/types/project"

export const ProjectFilter = {
  ALL: "ALL",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
} as const

export type ProjectFilter = (typeof ProjectFilter)[keyof typeof ProjectFilter]

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

export interface Tarefa {
  id: number
  title: string
  description: string
  priority: TarefaPriority
  status: TarefaStatus
  plannedStartDate: string
  plannedEndDate: string
}

export interface Etapa {
  id: number
  name: string
  description: string
  displayOrder: number
  status: EtapaStatus
  plannedStartDate: string
  plannedEndDate: string
  tasks: Tarefa[]
}

export interface ProjetoAcompanhamento {
  obraId: number
  titulo: string
  status: ProjectStatus
  totalEtapas: number
  etapasConcluidas: number
  totalTarefas: number
  tarefasConcluidas: number
  etapas: Etapa[]
}
