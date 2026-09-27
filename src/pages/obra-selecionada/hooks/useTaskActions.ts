import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createElement } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { ToastMessage } from "@/shared/components/ui/toast/ToastMessage"

import { TASK_STATUS } from "../constants/kanban"
import { createTarefa, deleteTarefa, updateTarefa } from "../services/tarefas.service"
import type { CreateTarefaRequest, Tarefa, TarefaComEtapa, TarefaStatus, UpdateTarefaRequest } from "../types/tarefas"

interface MoveInput {
  item: TarefaComEtapa
  status: TarefaStatus
  /** `false` na própria volta do Desfazer — desfazer não gera outro Desfazer. */
  undoable?: boolean
}

interface PatchInput {
  item: TarefaComEtapa
  patch: UpdateTarefaRequest
}

interface CreateInput {
  stageId: number
  payload: CreateTarefaRequest
}

function tasksKey(stageId: number) {
  return ["tarefas", stageId] as const
}

/**
 * Escritas de tarefa com cache otimista: o card muda de coluna (ou o campo
 * muda no drawer) na hora, e volta se o servidor recusar.
 *
 * O PATCH do backend valida `title` como obrigatório mesmo em atualização
 * parcial, por isso o título atual vai junto em toda escrita.
 */
export function useTaskActions(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  function invalidate(stageId: number) {
    void queryClient.invalidateQueries({ queryKey: tasksKey(stageId) })
    // Avanço da etapa e da obra saem das contagens de tarefa.
    void queryClient.invalidateQueries({ queryKey: ["stages", projectId] })
    void queryClient.invalidateQueries({ queryKey: ["acompanhamento", projectId] })
  }

  /** Aplica `patch` na tarefa do cache e devolve como desfazer. */
  function applyLocal(stageId: number, id: number, patch: Partial<Tarefa>) {
    const key = tasksKey(stageId)
    const previous = queryClient.getQueryData<Tarefa[]>(key)
    queryClient.setQueryData<Tarefa[]>(key, (list) => list?.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    return () => queryClient.setQueryData(key, previous)
  }

  const patchMutation = useMutation({
    mutationFn: ({ item, patch }: PatchInput) =>
      updateTarefa(item.stageId, item.tarefa.id, { title: item.tarefa.title, ...patch }),
    onMutate: ({ item, patch }) => ({ rollback: applyLocal(item.stageId, item.tarefa.id, patch) }),
    onError: (error: Error, _input, context) => {
      context?.rollback()
      toast.error(error.message || t("obra.tarefas.toasts.errorUpdating"))
    },
    onSettled: (_data, _error, { item }) => invalidate(item.stageId),
  })

  const moveMutation = useMutation({
    mutationFn: ({ item, status }: MoveInput) =>
      updateTarefa(item.stageId, item.tarefa.id, { title: item.tarefa.title, status }),
    onMutate: ({ item, status }) => ({ rollback: applyLocal(item.stageId, item.tarefa.id, { status }) }),
    onSuccess: (_data, { item, status, undoable = true }) => {
      const title =
        status === TASK_STATUS.DONE
          ? t("obra.tarefas.toasts.completed")
          : t("obra.tarefas.toasts.moved", { status: t(`obra.tarefas.columns.${status}`).toLowerCase() })
      const previous = item.tarefa.status
      toast.success(
        createElement(ToastMessage, {
          title,
          body: item.tarefa.title,
          action: undoable
            ? {
                label: t("common.undo"),
                onClick: () =>
                  moveMutation.mutate({ item: { ...item, tarefa: { ...item.tarefa, status } }, status: previous, undoable: false }),
              }
            : undefined,
        }),
        { autoClose: undoable ? 6000 : 3800 },
      )
    },
    onError: (error: Error, _input, context) => {
      context?.rollback()
      toast.error(error.message || t("obra.tarefas.toasts.errorMoving"))
    },
    onSettled: (_data, _error, { item }) => invalidate(item.stageId),
  })

  const createMutation = useMutation({
    mutationFn: ({ stageId, payload }: CreateInput) => createTarefa(stageId, payload),
    onSuccess: (_data, { stageId }) => {
      invalidate(stageId)
      toast.success(t("obra.tarefas.toasts.created"))
    },
    onError: (error: Error) => toast.error(error.message || t("obra.tarefas.toasts.errorCreating")),
  })

  const deleteMutation = useMutation({
    mutationFn: (item: TarefaComEtapa) => deleteTarefa(item.stageId, item.tarefa.id),
    onSuccess: (_data, item) => {
      invalidate(item.stageId)
      toast.success(t("obra.tarefas.toasts.deleted"))
    },
    onError: (error: Error) => toast.error(error.message || t("obra.tarefas.toasts.errorDeleting")),
  })

  return {
    move: (item: TarefaComEtapa, status: TarefaStatus) => {
      if (item.tarefa.status !== status) moveMutation.mutate({ item, status })
    },
    patch: (item: TarefaComEtapa, patch: UpdateTarefaRequest) => patchMutation.mutate({ item, patch }),
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
