import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { createDiarioEntry, getDiarioEntries } from "../services/diario.service"
import type { CreateDiarioEntryRequest } from "../types/diario"

export function useDiario(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ["diario", projectId]

  const query = useQuery({
    queryKey,
    queryFn: () => getDiarioEntries(projectId),
    enabled: projectId > 0,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateDiarioEntryRequest) => createDiarioEntry(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(t("obra.diario.toasts.created", "Registro salvo com sucesso!"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.diario.toasts.errorCreating", "Erro ao salvar registro"))
    },
  })

  return {
    entries: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
  }
}