import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import type { EtapaStatus } from "@/pages/projetos/types"

import {
  createStage,
  deleteStage,
  listStages,
  reorderStages,
  updateStage,
  type Stage,
  type StageRequest,
} from "../services/stages.service"

/**
 * Um arraste na lista de etapas pode fazer duas coisas de uma vez: trocar a
 * seção (status) e a posição (ordem). Vão juntas numa mutation só para haver um
 * único toast e um único refetch, e não dois cards "pulando" em sequência.
 */
export interface MoveStageInput {
  stage: Stage
  /** Novo status; omitir quando o card ficou na mesma seção. */
  status?: EtapaStatus
  /** Ordem global completa; omitir quando só o status mudou. */
  orderedIds?: number[]
}

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
    onSuccess: (data) => {
      // O backend já devolve a lista na ordem final: grava direto no cache para
      // a numeração assentar sem esperar o refetch, que segue rodando por trás
      // para manter a Visão geral em dia.
      queryClient.setQueryData(["stages", projectId], data.stages)
      invalidate()
      toast.success(t("obra.etapas.toasts.reorderSuccess"))
    },
  })

  const moveMutation = useMutation({
    mutationFn: async ({ stage, status, orderedIds }: MoveStageInput) => {
      if (status && status !== stage.status) {
        // O PATCH exige nome e ordem; o resto fica como está no servidor.
        await updateStage(stage.id, {
          name: stage.name,
          displayOrder: stage.displayOrder,
          status,
        })
      }
      if (orderedIds) {
        const result = await reorderStages(projectId, orderedIds)
        return result.stages
      }
      return null
    },
    onSuccess: (stages, { status, stage }) => {
      if (stages) queryClient.setQueryData(["stages", projectId], stages)
      invalidate()
      toast.success(
        status && status !== stage.status
          ? t("obra.etapas.toasts.moveSuccess", {
              status: t(`obra.etapas.etapaStatus.${status}`),
            })
          : t("obra.etapas.toasts.reorderSuccess"),
      )
    },
    onError: (error: Error, { status, stage }) => {
      toast.error(
        error.message ||
          t(
            status && status !== stage.status
              ? "obra.etapas.toasts.moveError"
              : "obra.etapas.toasts.reorderError",
          ),
      )
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
    move: moveMutation.mutate,
    isMoving: moveMutation.isPending,
  }
}
