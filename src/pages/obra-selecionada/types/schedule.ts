import type { RoleInProject } from "./equipes"

/**
 * Schedule dos integrantes — grade `integrante × dia` da obra (Telas v2 §15).
 *
 * Espelha `TeamScheduleResponse` do backend. Duas coisas que o contrato garante
 * e que o código daqui depende:
 *
 * - `members` já vem só com membros ACTIVE, ordenado por `joinedAt, id`;
 * - `members[].days` tem o mesmo tamanho e a mesma ordem de `days`.
 *
 * Toda data é `yyyy-MM-dd` **sem hora** — ver `utils/scheduleFormat.ts` antes de
 * passar qualquer uma delas para `new Date`.
 */

export const ScheduleView = {
  WEEK: "WEEK",
  MONTH: "MONTH",
} as const

export type ScheduleView = (typeof ScheduleView)[keyof typeof ScheduleView]

/**
 * Estado visual da célula, derivado de `allocated` + `overlapped`.
 *
 * O protótipo pintava a célula com um segundo tom quando a responsabilidade do
 * integrante era "Instalações" — string cravada no código, sem campo por trás.
 * O único sinal que o servidor calcula de verdade é a sobreposição (mais de uma
 * tarefa do mesmo integrante no mesmo dia), e é ela que ocupa o terceiro estado.
 */
export const DayState = {
  FREE: "FREE",
  ALLOCATED: "ALLOCATED",
  OVERLAP: "OVERLAP",
} as const

export type DayState = (typeof DayState)[keyof typeof DayState]

/**
 * Tarefa do dia. Só alimenta tooltip e `aria-label` nesta tela, por isso
 * `status` e `priority` ficam como string: tipá-los aqui duplicaria os enums de
 * `types/tarefas.ts` sem ninguém consumir a diferença.
 */
export interface ScheduledTask {
  id: number
  title: string
  status: string
  priority: string
  stageId: number | null
  stageName: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
}

export interface DaySchedule {
  date: string
  allocatedHours: number
  allocated: boolean
  overlapped: boolean
  tasks: ScheduledTask[]
}

export interface MemberSchedule {
  userId: number
  userName: string
  roleInProject: RoleInProject
  userResponsibility: string | null
  totalAllocatedHours: number
  hasOverlap: boolean
  days: DaySchedule[]
}

export interface TeamSchedule {
  constructionProjectId: number
  view: ScheduleView
  startDate: string
  endDate: string
  /** Data de referência do período anterior — o front não calcula datas. */
  previousDate: string
  /** Data de referência do próximo período. */
  nextDate: string
  days: string[]
  members: MemberSchedule[]
}

export interface ScheduleAllocation {
  constructionProjectId: number
  userId: number
  userName: string
  date: string
  allocatedHours: number
}

export interface ScheduleMemberInfo {
  constructionProjectId: number
  userId: number
  userName: string
  userResponsibility: string | null
}
