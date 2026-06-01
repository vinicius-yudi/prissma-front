import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import {
  createStage,
  deleteStage,
  listStages,
  reorderStages,
  updateStage,
  type StageRequest,
} from "../services/stages.service"

export function useStagesList(projectId: number) {
  const isValid = projectId > 0
  const query = useQuery({
    queryKey: ["stages", projectId],
    queryFn: () => listStages(projectId),
    enabled: isValid,
  })

  return {
    stages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

export function useStages(projectId: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["stages", projectId] })
    queryClient.invalidateQueries({ queryKey: ["acompanhamento", projectId] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: StageRequest) => createStage(projectId, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.etapas.toasts.createSuccess"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.etapas.toasts.createError"))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StageRequest }) =>
      updateStage(id, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.etapas.toasts.updateSuccess"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.etapas.toasts.updateError"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteStage(id),
    onSuccess: () => {
      invalidate()
      toast.success(t("obra.etapas.toasts.deleteSuccess"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.etapas.toasts.deleteError"))
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: number[]) => reorderStages(projectId, orderedIds),
    onError: (error: Error) => {
      toast.error(error.message || t("obra.etapas.toasts.reorderError"))
      invalidate()
    },
    onSuccess: () => {
      invalidate()
    },
  })

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    reorder: reorderMutation.mutate,
    isReordering: reorderMutation.isPending,
  }
}
