import { ProjectStatus } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"
import { startOfLocalDay, startOfToday } from "@/shared/utils/status"

const MS_PER_DAY = 86_400_000

export type DeadlineTone = "done" | "muted" | "late" | "soon" | "normal"

export interface Deadline {
  /** Chave i18n do rótulo; `count` entra na interpolação. */
  key: string
  count: number
  tone: DeadlineTone
}

/**
 * Dias até o prazo, em dias de calendário: os dois lados viram meia-noite
 * local antes da conta, senão a obra que vence hoje viraria "vencida" ainda de
 * manhã (a data pura do backend é lida como meia-noite UTC).
 */
export function daysUntil(end: string | null): number | null {
  const due = startOfLocalDay(end)
  if (!due) return null
  return Math.round((due.getTime() - startOfToday().getTime()) / MS_PER_DAY)
}

const TERMINAL: Partial<Record<Project["status"], Deadline>> = {
  [ProjectStatus.COMPLETED]: { key: "projects.card.completed", count: 0, tone: "done" },
  [ProjectStatus.CANCELLED]: { key: "projects.card.cancelled", count: 0, tone: "muted" },
}

/** O que o rodapé do card diz sobre o prazo — sempre com o número. */
export function projectDeadline(project: Pick<Project, "status" | "plannedEndDate">): Deadline {
  const terminal = TERMINAL[project.status]
  if (terminal) return terminal

  const days = daysUntil(project.plannedEndDate)
  if (days === null) return { key: "projects.card.noDeadline", count: 0, tone: "muted" }
  if (days < 0) return { key: "projects.card.overdue", count: -days, tone: "late" }
  if (days === 0) return { key: "projects.card.dueToday", count: 0, tone: "soon" }
  return { key: "projects.card.daysRemaining", count: days, tone: days <= 2 ? "soon" : "normal" }
}
