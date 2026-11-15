import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { getAnalyticsDashboard, getAnalyticsProjects, refreshAnalytics } from "../services/analytics.service"
import type { AnalyticsDashboard, AnalyticsProjectOption } from "../types/analytics"

const ANALYTICS_KEY = "analytics"

/**
 * O data warehouse só muda de hora em hora (ou num refresh manual, que
 * invalida o cache): cinco minutos de `staleTime` poupam refetch sem esconder
 * carga nova.
 */
const STALE_TIME = 5 * 60 * 1000

export function useAnalyticsDashboard(projectId: number | null): UseQueryResult<AnalyticsDashboard> {
  return useQuery({
    queryKey: [ANALYTICS_KEY, "dashboard", projectId ?? "all"],
    queryFn: () => getAnalyticsDashboard(projectId),
    staleTime: STALE_TIME,
  })
}

export function useAnalyticsProjects(): UseQueryResult<AnalyticsProjectOption[]> {
  return useQuery({
    queryKey: [ANALYTICS_KEY, "projects"],
    queryFn: getAnalyticsProjects,
    staleTime: STALE_TIME,
  })
}

/** Refaz a carga do DW agora e recarrega tudo o que veio dele. */
export function useRefreshAnalytics(): UseMutationResult<void, Error, void> {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: refreshAnalytics,
    onSuccess: () => {
      toast.success(t("relatorios.toasts.refreshed"))
      return queryClient.invalidateQueries({ queryKey: [ANALYTICS_KEY] })
    },
    onError: () => toast.error(t("relatorios.toasts.refreshError")),
  })
}
