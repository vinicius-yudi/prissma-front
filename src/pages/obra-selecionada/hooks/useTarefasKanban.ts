import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"

import { COLUMN_PREFIX } from "../constants/kanban"
import { ProjectPermission } from "../services/projectPermissions.service"
import type { Stage } from "../services/stages.service"
import type { TarefaComEtapa, TarefaStatus } from "../types/tarefas"
import { filterTasks, groupByStatus, isTaskLate } from "../utils/taskFilters"
import { useProjectPermissions } from "./useProjectPermissions"
import { useTaskActions } from "./useTaskActions"
import { useTaskFilters } from "./useTaskFilters"
import { useTarefasByProject } from "./useTarefasByProject"

/** Espaço e Esc no teclado: Enter fica livre para abrir a tarefa. */
const KEYBOARD_CODES = { start: ["Space"], cancel: ["Escape"], end: ["Space"] }

export function columnDroppableId(status: TarefaStatus): string {
  return `${COLUMN_PREFIX}${status}`
}

/** Etapa que recebe a tarefa criada sem etapa escolhida: a em andamento, ou a primeira aberta. */
function defaultStage(stages: Stage[]): Stage | null {
  const open = stages.filter((s) => s.status !== EtapaStatus.DONE)
  return open.find((s) => s.status === EtapaStatus.IN_PROGRESS) ?? open[0] ?? stages[0] ?? null
}

/**
 * Estado do quadro de tarefas: dados achatados, filtros da URL, colunas e o
 * arraste. Mover de coluna é o PATCH de status; o card troca de coluna na hora
 * (cache otimista em `useTaskActions`).
 */
export function useTarefasKanban(projectId: number) {
  const { stages: stagesWithTasks, isLoading } = useTarefasByProject(projectId)
  const { can, isAdmin } = useProjectPermissions(projectId)
  const canMutate = isAdmin || can(ProjectPermission.MANAGE_TASKS)
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMyProfile })
  const filterState = useTaskFilters()
  const actions = useTaskActions(projectId)
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    // Distância mínima para o clique no card (abrir) não virar arraste.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // No toque, pressão longa: rolar a coluna não pode virar arraste.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { keyboardCodes: KEYBOARD_CODES }),
  )

  const stages = stagesWithTasks.map(({ stage }) => stage)
  const all: TarefaComEtapa[] = stagesWithTasks.flatMap(({ stage, tasks }) =>
    tasks.map((tarefa) => ({ tarefa, stageId: stage.id, stageName: stage.name })),
  )
  const visible = filterTasks(all, filterState.filters, meQuery.data?.id ?? null)
  const selectedStage = stages.find((s) => s.id === filterState.filters.stageId) ?? null

  function findItem(id: number): TarefaComEtapa | undefined {
    return all.find((item) => item.tarefa.id === id)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    const overId = over ? String(over.id) : ""
    const item = findItem(Number(active.id))
    if (!item || !overId) return
    // Cai na coluna ou sobre um card dela — nos dois casos vale o status do alvo.
    const target = overId.startsWith(COLUMN_PREFIX)
      ? (overId.slice(COLUMN_PREFIX.length) as TarefaStatus)
      : findItem(Number(overId))?.tarefa.status
    if (target) actions.move(item, target)
  }

  return {
    stages,
    isLoading,
    canMutate,
    filterState,
    actions,
    all,
    visible,
    columns: groupByStatus(visible),
    lateCount: all.filter(({ tarefa }) => isTaskLate(tarefa)).length,
    /** Etapa onde nasce a tarefa: a do filtro, ou a atual da obra. */
    targetStage: selectedStage ?? defaultStage(stages),
    sensors,
    active: activeId === null ? null : (findItem(activeId) ?? null),
    handleDragStart: ({ active }: DragStartEvent) => setActiveId(Number(active.id)),
    handleDragEnd,
    handleDragCancel: () => setActiveId(null),
  }
}

export type TarefasKanban = ReturnType<typeof useTarefasKanban>
