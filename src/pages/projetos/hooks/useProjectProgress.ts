import { useQuery } from "@tanstack/react-query"

import { lateStages, projectProgress, stageProgress } from "@/shared/utils/progress"

import { getProjectAcompanhamento } from "../services/projects.service"
import { EtapaStatus } from "../types"
import type { AcompanhamentoEtapa } from "../types"

export interface ProjectProgressResult {
  /** Avanço físico 0–100; `null` enquanto o acompanhamento não chegou. */
  progress: number | null
  /** Etapas vencidas e não concluídas. */
  lateCount: number
  /** Etapa em andamento (ou a próxima a começar), para o rodapé do card. */
  currentStage: { name: string; progress: number } | null
}

function pickCurrentStage(etapas: AcompanhamentoEtapa[]): AcompanhamentoEtapa | undefined {
  const ordered = [...etapas].sort((a, b) => a.displayOrder - b.displayOrder)
  return ordered.find((e) => e.status === EtapaStatus.IN_PROGRESS) ?? ordered.find((e) => e.status !== EtapaStatus.DONE)
}

/**
 * Avanço de uma obra a partir do acompanhamento. Mesma `queryKey` que a tela
 * de etapas invalida ao mudar uma etapa, então o card acompanha sozinho.
 */
export function useProjectProgress(projectId: number): ProjectProgressResult {
  const { data } = useQuery({
    queryKey: ["acompanhamento", projectId],
    queryFn: () => getProjectAcompanhamento(projectId),
    staleTime: 60_000,
  })

  if (!data) return { progress: null, lateCount: 0, currentStage: null }

  const etapas = data.etapas ?? []
  const current = pickCurrentStage(etapas)

  return {
    progress: projectProgress(etapas),
    lateCount: lateStages(etapas),
    currentStage: current ? { name: current.name, progress: stageProgress(current) } : null,
  }
}
