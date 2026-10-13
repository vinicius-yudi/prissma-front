import { useSearchParams } from "react-router-dom"

import type { TaskFilters } from "../utils/taskFilters"

/** Filtros das tarefas na URL (CLAUDE.md §8): recarregar não perde a vista. */
const PARAM = {
  stage: "etapa",
  mine: "minhas",
  late: "atrasadas",
  query: "busca",
} as const

const ON = "1"

export interface UseTaskFiltersResult {
  filters: TaskFilters
  setStage: (stageId: number | null) => void
  toggleMine: () => void
  toggleLate: () => void
  setQuery: (query: string) => void
  clear: () => void
}

function readStage(value: string | null): number | null {
  const id = Number(value)
  return value && Number.isInteger(id) && id > 0 ? id : null
}

export function useTaskFilters(): UseTaskFiltersResult {
  const [params, setParams] = useSearchParams()
  const filters: TaskFilters = {
    stageId: readStage(params.get(PARAM.stage)),
    mine: params.get(PARAM.mine) === ON,
    onlyLate: params.get(PARAM.late) === ON,
    query: params.get(PARAM.query) ?? "",
  }

  // Uma escrita por mudança: duas `setParams` seguidas se sobrescrevem.
  function write(key: string, value: string | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function clear() {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of Object.values(PARAM)) next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  return {
    filters,
    setStage: (stageId) => write(PARAM.stage, stageId === null ? null : String(stageId)),
    toggleMine: () => write(PARAM.mine, filters.mine ? null : ON),
    toggleLate: () => write(PARAM.late, filters.onlyLate ? null : ON),
    setQuery: (query) => write(PARAM.query, query || null),
    clear,
  }
}
