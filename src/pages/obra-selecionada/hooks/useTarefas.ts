import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import {createTarefa,
  deleteTarefa,
  getTarefas,
  updateTarefa,
} from "../services/tarefas.service"
import type { CreateTarefaRequest, UpdateTarefaRequest } from "../types/tarefas"

export function useTarefas(stageId: number | null) {
  const { t } = useTranslation()
  function tr(key: string, fallback: string) {
    const val = t(key)
    return val === key ? fallback : val
  }
  const queryClient = useQueryClient()
  const queryKey = ["tarefas", stageId]
  const isValid = stageId !== null && stageId > 0

  const query = useQuery({
    queryKey,
    queryFn: () => getTarefas(stageId!),
    enabled: isValid,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
  }

  const createMutation = useMutation({
    mutationFn: (data: CreateTarefaRequest) => createTarefa(stageId!, data),
    onSuccess: () => {
      invalidate()
      toast.success(tr("obra.tarefas.toasts.created", "Tarefa criada com sucesso!"))
    },
    onError: (error: Error) => {
      toast.error(error.message || tr("obra.tarefas.toasts.errorCreating", "Erro ao criar tarefa"))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTarefaRequest }) =>
      updateTarefa(stageId!, id, data),
    onSuccess: () => {
      invalidate()
      toast.success(tr("obra.tarefas.toasts.updated", "Tarefa atualizada com sucesso!"))
    },
    onError: (error: Error) => {
      toast.error(error.message || tr("obra.tarefas.toasts.errorUpdating", "Erro ao atualizar tarefa"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTarefa(stageId!, id),
    onSuccess: () => {
      invalidate()
      toast.success(tr("obra.tarefas.toasts.deleted", "Tarefa deletada com sucesso!"))
    },
    onError: (error: Error) => {
      toast.error(error.message || tr("obra.tarefas.toasts.errorDeleting", "Erro ao deletar tarefa"))
    },
  })

  return {
    tarefas: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
