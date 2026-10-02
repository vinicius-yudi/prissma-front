import type { TarefaPriority, TarefaStatus } from "../types/tarefas"

/** Status de tarefa como constantes — nada de comparar com literal solto. */
export const TASK_STATUS = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  BLOCKED: "BLOCKED",
  DONE: "DONE",
} as const satisfies Record<TarefaStatus, TarefaStatus>

export const TASK_PRIORITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const satisfies Record<TarefaPriority, TarefaPriority>

/**
 * Ordem das colunas do kanban (redesign): o fluxo, com Bloqueada antes de
 * Concluída — bloqueio é o que pede decisão, não pode ficar no fim da tela.
 */
export const COLUMN_STATUSES: TarefaStatus[] = [
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.BLOCKED,
  TASK_STATUS.DONE,
]

export const PRIORITIES: TarefaPriority[] = [TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH]

/** Concluída mostra só as mais recentes até pedir "Ver mais". */
export const DONE_PREVIEW = 5

/** Prazo padrão da adição rápida, em dias a partir do início. */
export const QUICK_ADD_DAYS = 7

/** Prefixo do id de droppable da coluna — o id do card é o número da tarefa. */
export const COLUMN_PREFIX = "col:"
