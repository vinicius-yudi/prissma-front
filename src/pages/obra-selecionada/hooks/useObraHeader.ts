import { useProjectProgress } from "@/pages/projetos/hooks/useProjectProgress"
import type { ProjectProgressResult } from "@/pages/projetos/hooks/useProjectProgress"
import { ProjectStatus } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"
import { dateProgress } from "@/shared/utils/status"

import { useObraMembers } from "./useObraMembers"
import { useProjectBudgetQuery } from "./useProjectBudgetQuery"

export type PaceTone = "late" | "ahead" | "onTrack" | "behind"

export interface Pace {
  tone: PaceTone
  /** Pontos de diferença entre o real e o esperado para hoje, sempre positivo. */
  points: number
}

export interface BudgetSummary {
  spent: number
  planned: number
  /** Percentual usado, 0–∞ (acima de 100 = estouro). */
  percent: number
  exceeded: boolean
}

export interface ObraHeaderData {
  progress: ProjectProgressResult
  /** Onde a obra deveria estar hoje; só existe em obra em andamento. */
  expected: number | undefined
  pace: Pace | null
  budget: BudgetSummary | null
  members: { id: number; name: string }[]
}

/**
 * DS v2, Trena: mais de 5 pontos atrás do esperado é problema; dentro de ±3
 * pontos, "no ritmo do cronograma".
 */
export function paceOf(progress: number, expected: number): Pace {
  const diff = progress - expected
  const points = Math.round(Math.abs(diff))
  if (points <= 3) return { tone: "onTrack", points }
  if (diff > 0) return { tone: "ahead", points }
  if (diff < -5) return { tone: "late", points }
  return { tone: "behind", points }
}

/**
 * O que o cabeçalho da obra mostra, nas duas formas (completa e compacta):
 * avanço físico e o esperado para hoje, ritmo, orçamento e equipe. Cada fonte
 * tem a própria `queryKey`, compartilhada com o módulo que a edita.
 */
export function useObraHeader(project: Project): ObraHeaderData {
  const progress = useProjectProgress(project.id)
  const members = useObraMembers(project.id)
  const budget = useProjectBudgetQuery(project.id)

  const inProgress = project.status === ProjectStatus.IN_PROGRESS
  const expected = inProgress ? dateProgress(project.plannedStartDate, project.plannedEndDate) : undefined

  return {
    progress,
    expected,
    pace: expected !== undefined && progress.progress !== null ? paceOf(progress.progress, expected) : null,
    budget: budget
      ? {
          spent: budget.totalSpent,
          planned: budget.plannedTotal,
          percent: budget.plannedTotal > 0 ? Math.round((budget.totalSpent / budget.plannedTotal) * 100) : 0,
          exceeded: budget.exceeded || budget.items.some((item) => item.exceeded),
        }
      : null,
    members: members.list.map((member) => ({ id: member.id, name: member.user.name })),
  }
}
