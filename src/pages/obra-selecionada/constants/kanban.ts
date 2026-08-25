import type { TarefaStatus } from "../types/tarefas"

/**
 * Ordem das colunas do kanban (Telas §13).
 *
 * A ordem é a do fluxo de trabalho, não alfabética: bloqueada fica por último
 * porque é desvio, não etapa do caminho.
 */
export const COLUMN_STATUSES: TarefaStatus[] = ["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]

/** Valor do filtro de etapa que significa "todas". */
export const ALL_STAGES = "ALL"
