import { EtapaStatus } from "@/pages/projetos/types"

import type { Stage } from "../services/stages.service"

/**
 * Andamento de etapa, derivado do status.
 *
 * É aproximação, não medição: o backend não expõe percentual executado por
 * etapa, só o status. Fica num lugar só porque estava duplicado — `EtapaCard`
 * tinha um `switch` e a Visão geral um `Record`, e as duas telas podiam
 * divergir para a mesma etapa.
 */
const PROGRESS_BY_STATUS: Record<EtapaStatus, number> = {
  [EtapaStatus.PLANNED]: 0,
  [EtapaStatus.IN_PROGRESS]: 50,
  [EtapaStatus.BLOCKED]: 0,
  [EtapaStatus.DONE]: 100,
}

export function stageProgress(stage: Stage): number {
  return PROGRESS_BY_STATUS[stage.status] ?? 0
}

export function averageStageProgress(stages: Stage[]): number {
  if (stages.length === 0) return 0
  return Math.round(stages.reduce((acc, s) => acc + stageProgress(s), 0) / stages.length)
}

/** Etapa atual: a primeira em andamento; se não houver, a primeira não concluída. */
export function currentStage(stages: Stage[]): Stage | null {
  return (
    stages.find((s) => s.status === EtapaStatus.IN_PROGRESS) ??
    stages.find((s) => s.status !== EtapaStatus.DONE) ??
    null
  )
}

export function countDoneStages(stages: Stage[]): number {
  return stages.filter((s) => s.status === EtapaStatus.DONE).length
}
