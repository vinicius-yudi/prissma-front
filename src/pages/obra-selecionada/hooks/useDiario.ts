import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { createDiarioEntry, deleteDiarioEntry, getDiarioEntries } from "../services/diario.service"
import type { CreateDiarioEntryRequest, DiarioEntry, DiarioPage } from "../types/diario"

function normalizePage(data: DiarioPage | DiarioEntry[], page: number): DiarioPage {
  if (Array.isArray(data)) {
    return {
      content: data,
      page,
      size: data.length,
      totalElements: data.length,
      totalPages: 1,
      last: true,
    }
  }
  return data
}

export function useDiario(projectId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ["diario", projectId]

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => getDiarioEntries(projectId, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const page = normalizePage(lastPage, pages.length - 1)
      return page.last ? undefined : pages.length
    },
    enabled: projectId > 0,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateDiarioEntryRequest) => createDiarioEntry(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(t("obra.diario.toasts.created"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.diario.toasts.errorCreating"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDiarioEntry(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(t("obra.diario.toasts.deleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.diario.toasts.errorDeleting"))
    },
  })

  return {
    entries: query.data?.pages.flatMap((page, index) => normalizePage(page, index).content) ?? [],
    isLoading: query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}