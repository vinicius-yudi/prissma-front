import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { PageHeader } from "@/shared/components/ui/page-header/PageHeader"
import { useAccess } from "@/shared/hooks/useAccess"

import { AnalyticsDashboard } from "./components/AnalyticsDashboard"
import { ProjectFilter } from "./components/ProjectFilter"
import { useAnalyticsProjects } from "./hooks/useAnalytics"

/** `?obra=<id>` filtra o dashboard; sem ele, todas as obras (CLAUDE.md §8). */
const PROJECT_PARAM = "obra"

/**
 * Relatórios (nível 1): o dashboard de analytics consolidado da conta, com o
 * filtro "Obra" do protótipo da especificação (seção 8).
 */
export function RelatoriosPage() {
  const { t } = useTranslation()
  const { isReadOnly } = useAccess()
  const [params, setParams] = useSearchParams()
  const projects = useAnalyticsProjects()

  const projectId = Number(params.get(PROJECT_PARAM)) || null
  const selected = projects.data?.find((project) => project.projectId === projectId)

  function handleSelect(id: number | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === null) next.delete(PROJECT_PARAM)
        else next.set(PROJECT_PARAM, String(id))
        return next
      },
      { replace: true },
    )
  }

  return (
    <div>
      <PageHeader title={t("relatorios.title")} subtitle={t("relatorios.subtitle")} />
      <AnalyticsDashboard
        projectId={projectId}
        scopeLabel={selected?.projectTitle ?? t("relatorios.filter.all")}
        canExport={!isReadOnly("relatorios")}
        filter={<ProjectFilter projects={projects.data ?? []} value={projectId} onChange={handleSelect} />}
      />
    </div>
  )
}
