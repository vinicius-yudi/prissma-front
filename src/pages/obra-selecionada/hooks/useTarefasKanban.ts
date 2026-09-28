import { PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { ALL_STAGES } from "../constants/kanban"
import { deleteTarefa, updateTarefa } from "../services/tarefas.service"
import type { Tarefa, TarefaComEtapa, TarefaStatus } from "../types/tarefas"
import { useProjectPermissions } from "./useProjectPermissions"
import { useTarefasByProject } from "./useTarefasByProject"
import { ProjectPermission } from "../services/projectPermissions.service"

/**
 * Estado e ações do kanban de tarefas.
 *
 * Concentra o que não é UI: achatar etapas em tarefas, filtrar por etapa,
 * mover de coluna (que é o `PATCH` de status) e excluir. O componente fica só
 * com o desenho.
 */

interface UseTarefasKanbanResult {
  stages: ReturnType<typeof useTarefasByProject>["stages"]
  isLoading: boolean
  canMutate: boolean
  /** Primeira etapa da obra — destino padrão ao criar tarefa sem filtro. */
  firstStageId: number | null

  stageFilter: string
  setStageFilter: (value: string) => void
  /** Tarefas já filtradas pela etapa selecionada. */
  visible: TarefaComEtapa[]
  byStatus: (status: TarefaStatus) => TarefaComEtapa[]

  sensors: ReturnType<typeof useSensors>
  handleDragEnd: (event: DragEndEvent) => void

  deleting: TarefaComEtapa | null
  requestDelete: (item: TarefaComEtapa) => void
  cancelDelete: () => void
  confirmDelete: () => void
  isDeleting: boolean
}

export function useTarefasKanban(projectId: number): UseTarefasKanbanResult {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { stages, isLoading } = useTarefasByProject(projectId)
  const { can, isAdmin } = useProjectPermissions(projectId)
  const canMutate = isAdmin || can(ProjectPermission.MANAGE_TASKS)

  const [stageFilter, setStageFilter] = useState<string>(ALL_STAGES)
  const [deleting, setDeleting] = useState<TarefaComEtapa | null>(null)

  // Arrastar exige um deslocamento mínimo, senão o clique nos botões de editar
  // e excluir do card é engolido pelo gesto de drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allTasks = useMemo<TarefaComEtapa[]>(
    () =>
      stages.flatMap(({ stage, tasks }) =>
        tasks.map((tarefa) => ({ tarefa, stageId: stage.id, stageName: stage.name })),
      ),
    [stages],
  )

  const visible = useMemo(
    () =>
      stageFilter === ALL_STAGES
        ? allTasks
        : allTasks.filter((item) => String(item.stageId) === stageFilter),
    [allTasks, stageFilter],
  )

  const moveMutation = useMutation({
    mutationFn: ({ stageId, id, status }: { stageId: number; id: number; status: TarefaStatus }) =>
      updateTarefa(stageId, id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tarefas", variables.stageId] })
      // O andamento da etapa é derivado das tarefas dela, então precisa recarregar.
      queryClient.invalidateQueries({ queryKey: ["stages", projectId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.tarefas.toasts.errorMoving"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ stageId, id }: { stageId: number; id: number }) => deleteTarefa(stageId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tarefas", variables.stageId] })
      setDeleting(null)
      toast.success(t("obra.tarefas.toasts.deleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.tarefas.toasts.errorDeleting"))
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const target = event.over?.id as TarefaStatus | undefined
    const data = event.active.data.current as { tarefa: Tarefa; stageId: number } | undefined
    if (!target || !data || data.tarefa.status === target) return

    moveMutation.mutate({ stageId: data.stageId, id: data.tarefa.id, status: target })
  }

  function confirmDelete() {
    if (!deleting) return
    deleteMutation.mutate({ stageId: deleting.stageId, id: deleting.tarefa.id })
  }

  return {
    stages,
    isLoading,
    canMutate,
    firstStageId: stages[0]?.stage.id ?? null,

    stageFilter,
    setStageFilter,
    visible,
    byStatus: (status) => visible.filter((item) => item.tarefa.status === status),

    sensors,
    handleDragEnd,

    deleting,
    requestDelete: setDeleting,
    cancelDelete: () => setDeleting(null),
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  }
}
