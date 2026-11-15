import type { UseQueryResult } from "@tanstack/react-query"
import { ChartNoAxesColumn, RefreshCw } from "lucide-react"
import { lazy, Suspense } from "react"
import type { Ref } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

import type { AnalyticsDashboard } from "../types/analytics"
import { isDashboardEmpty } from "../utils/analyticsData"
import { AnalyticsSkeleton } from "./AnalyticsSkeleton"

// Os gráficos trazem o Recharts: carregados só quando há dado para desenhar,
// fora do bundle inicial do app.
const AnalyticsSheet = lazy(() => import("./AnalyticsSheet").then((module) => ({ default: module.AnalyticsSheet })))

interface AnalyticsBodyProps {
  query: UseQueryResult<AnalyticsDashboard>
  showProject: boolean
  sheetRef: Ref<HTMLDivElement>
}

/** Corpo do dashboard: carregando, erro, vazio ou a folha — um por vez. */
export function AnalyticsBody({ query, showProject, sheetRef }: AnalyticsBodyProps) {
  const { t } = useTranslation()

  if (query.isLoading) return <AnalyticsSkeleton />

  if (query.isError || !query.data) {
    return (
      <EmptyState
        title={t("relatorios.errors.load")}
        action={
          <Button variant="outline" fullWidth={false} onClick={() => void query.refetch()}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        }
      />
    )
  }

  if (isDashboardEmpty(query.data)) {
    return <EmptyState icon={<ChartNoAxesColumn size={26} />} title={t("relatorios.empty.title")} body={t("relatorios.empty.body")} />
  }

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsSheet ref={sheetRef} data={query.data} showProject={showProject} />
    </Suspense>
  )
}
