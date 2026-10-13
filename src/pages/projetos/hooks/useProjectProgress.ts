import { useQuery } from "@tanstack/react-query"

import { lateStages, projectProgress, stageProgress } from "@/shared/utils/progress"
import { daysLate } from "@/shared/utils/status"

import { getProjectAcompanhamento } from "../services/projects.service"
import { EtapaStatus } from "../types"
import type { AcompanhamentoEtapa } from "../types"

/** Etapa do acompanhamento com o que a tela precisa já calculado. */
export interface StageSummary extends AcompanhamentoEtapa {
  /** Avanço físico 0–100, pelas tarefas. */
  progress: number
  /** Dias além do prazo; 0 no prazo ou concluída. */
  daysLate: number
}

export interface ProjectProgressResult {
  /** Avanço físico 0–100; `null` enquanto o acompanhamento não chegou. */
  progress: number | null
  /** Etapas vencidas e não concluídas. */
  lateCount: number
  /** Etapa em andamento (ou a próxima a começar). */
  currentStage: StageSummary | null
  /** Etapas em ordem de exibição, cada uma com avanço e atraso. */
  stages: StageSummary[]
  /** Tarefas ainda não concluídas na obra. */
  openTasks: number
  isLoading: boolean
}

function summarize(etapa: AcompanhamentoEtapa): StageSummary {
  return {
    ...etapa,
    progress: stageProgress(etapa),
    daysLate: etapa.status === EtapaStatus.DONE ? 0 : daysLate(etapa.plannedEndDate),
  }
}

function pickCurrentStage(stages: StageSummary[]): StageSummary | null {
  return (
    stages.find((e) => e.status === EtapaStatus.IN_PROGRESS) ??
    stages.find((e) => e.status !== EtapaStatus.DONE) ??
    null
  )
}

/**
 * Avanço de uma obra a partir do acompanhamento. Mesma `queryKey` que a tela
 * de etapas invalida ao mudar uma etapa, então card, cabeçalho e visão geral
 * acompanham sozinhos.
 */
export function useProjectProgress(projectId: number): ProjectProgressResult {
  const { data, isLoading } = useQuery({
    queryKey: ["acompanhamento", projectId],
    queryFn: () => getProjectAcompanhamento(projectId),
    staleTime: 60_000,
    enabled: projectId > 0,
  })

  if (!data) {
    return { progress: null, lateCount: 0, currentStage: null, stages: [], openTasks: 0, isLoading }
  }

  const stages = [...(data.etapas ?? [])].sort((a, b) => a.displayOrder - b.displayOrder).map(summarize)

  return {
    progress: projectProgress(stages),
    lateCount: lateStages(stages),
    currentStage: pickCurrentStage(stages),
    stages,
    openTasks: Math.max(0, (data.totalTarefas ?? 0) - (data.tarefasConcluidas ?? 0)),
    isLoading,
  }
}
