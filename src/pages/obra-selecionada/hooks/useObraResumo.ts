import { useMemo } from "react"

import { daysLate } from "@/shared/utils/status"

import type { Stage } from "../services/stages.service"
import type { ConstructionProjectMember } from "../types/equipes"
import { averageStageProgress, countDoneStages, currentStage } from "../utils/stageProgress"
import { calculatePercent } from "../utils/budgetMath"
import { useBudget } from "./useBudget"
import { useObraMembers } from "./useObraMembers"
import { useStagesList } from "./useStages"

/**
 * Dados consolidados da Visão geral da obra.
 *
 * Junta etapas, orçamento e equipe — três fontes — e devolve já derivado o que
 * a tela mostra: andamento médio, etapa atual, contagem de concluídas, dias de
 * atraso e o percentual do orçamento. O componente não faz conta.
 */

interface UseObraResumoParams {
  projectId: number
  plannedEndDate: string | null
}

interface UseObraResumoResult {
  /** Etapas ordenadas por `displayOrder`, prontas para a timeline. */
  stages: Stage[]
  progress: number
  atual: Stage | null
  doneCount: number
  /** Dias além do prazo final da obra. 0 quando no prazo. */
  projectLate: number

  budget: ReturnType<typeof useBudget>["budget"]
  spentPercent: number

  members: ConstructionProjectMember[] | undefined
  membersCount: number
}

export function useObraResumo({
  projectId,
  plannedEndDate,
}: UseObraResumoParams): UseObraResumoResult {
  const { stages } = useStagesList(projectId)
  const { budget } = useBudget(projectId)

  const membersQuery = useObraMembers(projectId)

  const ordered = useMemo(
    () => [...stages].sort((a, b) => a.displayOrder - b.displayOrder),
    [stages],
  )

  return {
    stages: ordered,
    progress: averageStageProgress(stages),
    atual: currentStage(ordered),
    doneCount: countDoneStages(stages),
    projectLate: daysLate(plannedEndDate),

    budget,
    spentPercent: budget ? calculatePercent(budget.totalSpent, budget.plannedTotal) : 0,

    members: membersQuery.members,
    membersCount: membersQuery.count,
  }
}
