import { daysLate } from "@/shared/utils/status"

import { DONE_PREVIEW, TASK_STATUS } from "../constants/kanban"
import type { Tarefa, TarefaComEtapa, TarefaStatus } from "../types/tarefas"

export interface TaskFilters {
  /** Id da etapa; `null` é "todas". */
  stageId: number | null
  mine: boolean
  onlyLate: boolean
  query: string
}

/** Busca sem acento e sem caixa: "fundacao" acha "Fundação". */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function isTaskLate(tarefa: Pick<Tarefa, "status" | "plannedEndDate">): boolean {
  return tarefa.status !== TASK_STATUS.DONE && daysLate(tarefa.plannedEndDate) > 0
}

export function hasActiveFilters(filters: TaskFilters): boolean {
  return filters.stageId !== null || filters.mine || filters.onlyLate || filters.query.trim() !== ""
}

/** Aplica os quatro filtros da barra; `meId` nulo faz "minhas" não achar nada. */
export function filterTasks(items: TarefaComEtapa[], filters: TaskFilters, meId: number | null): TarefaComEtapa[] {
  const query = normalizeText(filters.query.trim())
  return items.filter(({ tarefa, stageId }) => {
    if (filters.stageId !== null && stageId !== filters.stageId) return false
    if (filters.mine && (meId === null || tarefa.assigneeUserId !== meId)) return false
    if (filters.onlyLate && !isTaskLate(tarefa)) return false
    return !query || normalizeText(tarefa.title).includes(query)
  })
}

export function groupByStatus(items: TarefaComEtapa[]): Record<TarefaStatus, TarefaComEtapa[]> {
  const groups: Record<TarefaStatus, TarefaComEtapa[]> = { TODO: [], IN_PROGRESS: [], BLOCKED: [], DONE: [] }
  for (const item of items) groups[item.tarefa.status]?.push(item)
  return groups
}

/** As concluídas mais recentes primeiro — o que acabou de fechar é o que interessa. */
export function recentDone(items: TarefaComEtapa[], showAll: boolean): TarefaComEtapa[] {
  const sorted = [...items].sort((a, b) => b.tarefa.updatedAt.localeCompare(a.tarefa.updatedAt))
  return showAll ? sorted : sorted.slice(0, DONE_PREVIEW)
}
