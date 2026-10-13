import { daysLate, startOfLocalDay } from "./status"

/**
 * Avanço físico da obra, calculado das etapas e das tarefas de cada uma.
 *
 * O acompanhamento do backend (`/projects/{id}/acompanhamento`) não traz um
 * percentual nem a lista de tarefas por etapa — traz o total de tarefas e a
 * contagem por status. A conta fica aqui, num lugar só, para card de obra,
 * Início e visão geral nunca mostrarem números diferentes para a mesma obra.
 *
 * - Tarefa concluída vale 1; em andamento, 0.4 — já começou, mas não entrega.
 * - Etapa sem tarefas: concluída 100, em andamento 25, o resto 0.
 * - A obra é a média das etapas ponderada pela duração planejada: uma etapa
 *   de três meses pesa mais que uma de uma semana.
 *
 * O tempo decorrido (`dateProgress`) NÃO é avanço: é o marcador "esperado
 * hoje" da trena.
 */

export interface ProgressStage {
  status: string
  plannedStartDate?: string | null
  plannedEndDate?: string | null
  totalTarefas: number
  taskStatusCounts: Partial<Record<string, number>>
}

const DONE = "DONE"
const IN_PROGRESS = "IN_PROGRESS"
const STAGE_WITHOUT_TASKS: Record<string, number> = { [DONE]: 100, [IN_PROGRESS]: 25 }
const MS_PER_DAY = 86_400_000

export function stageProgress(stage: ProgressStage): number {
  if (stage.status === DONE) return 100
  if (!stage.totalTarefas) return STAGE_WITHOUT_TASKS[stage.status] ?? 0

  const done = stage.taskStatusCounts[DONE] ?? 0
  const started = stage.taskStatusCounts[IN_PROGRESS] ?? 0
  return Math.round(((done + started * 0.4) / stage.totalTarefas) * 100)
}

function durationInDays(stage: ProgressStage): number {
  const start = startOfLocalDay(stage.plannedStartDate)
  const end = startOfLocalDay(stage.plannedEndDate)
  if (!start || !end) return 1
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY))
}

export function projectProgress(stages: ProgressStage[]): number {
  if (stages.length === 0) return 0
  const weights = stages.map(durationInDays)
  const total = weights.reduce((sum, w) => sum + w, 0)
  const weighted = stages.reduce((sum, stage, i) => sum + stageProgress(stage) * weights[i], 0)
  return Math.round(weighted / total)
}

/**
 * Etapas vencidas e não concluídas — o que pede decisão no card da obra. As
 * tarefas atrasadas não entram: o acompanhamento não traz as datas delas.
 */
export function lateStages(stages: ProgressStage[]): number {
  return stages.filter((stage) => stage.status !== DONE && daysLate(stage.plannedEndDate) > 0).length
}
