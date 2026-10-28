import { useRef, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/contexts/AuthContext"
import { isWorkspaceManager } from "@/shared/types/workspace"

import { useAnalyticsDashboard, useRefreshAnalytics } from "../hooks/useAnalytics"
import { useDashboardPdf, useProjectReport } from "../hooks/useAnalyticsExports"
import type { ReportPeriodFormData } from "../schemas/reportPeriod.schema"
import { isDashboardEmpty } from "../utils/analyticsData"
import { pdfFileName } from "../utils/dashboardPdf"
import { AnalyticsBody } from "./AnalyticsBody"
import { AnalyticsToolbar } from "./AnalyticsToolbar"
import { ReportModal } from "./ReportModal"

interface AnalyticsDashboardProps {
  /** `null` consolida todas as obras que o usuário alcança no workspace. */
  projectId: number | null
  /** Nome do recorte (obra ou "Todas as obras"), para o cabeçalho do PDF. */
  scopeLabel: string
  /** Seletor de obra — só no consolidado. */
  filter?: ReactNode
  /** Módulo com escrita: exports liberados (somente-leitura só consulta). */
  canExport: boolean
}

/**
 * Dashboard de analytics, usado no consolidado (Relatórios, nível 1) e dentro
 * da obra (Indicadores). Os dados vêm do data warehouse, atualizado de hora em
 * hora; OWNER/ADMIN da conta podem forçar a recarga.
 */
export function AnalyticsDashboard({ projectId, scopeLabel, filter, canExport }: AnalyticsDashboardProps) {
  const { t, i18n } = useTranslation()
  const { activeWorkspace } = useAuth()
  const query = useAnalyticsDashboard(projectId)
  const refresh = useRefreshAnalytics()
  const pdf = useDashboardPdf()
  const report = useProjectReport(projectId)
  const [isReportOpen, setReportOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const lastRefreshAt = query.data?.lastRefreshAt
  const updatedAt = lastRefreshAt ? new Date(lastRefreshAt).toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" }) : null
  const hasData = !!query.data && !isDashboardEmpty(query.data)

  function handleExport() {
    if (!sheetRef.current) return
    pdf.mutate({
      sheet: sheetRef.current,
      fileName: pdfFileName(scopeLabel),
      header: {
        title: t("relatorios.pdf.title"),
        subtitle: updatedAt ? `${scopeLabel} · ${t("relatorios.updatedAt", { date: updatedAt })}` : scopeLabel,
        generatedAt: t("relatorios.pdf.generatedAt", { date: new Date().toLocaleString(i18n.language, { dateStyle: "short", timeStyle: "short" }) }),
      },
    })
  }

  function handleGenerateReport(period: ReportPeriodFormData) {
    report.mutate(period, { onSuccess: () => setReportOpen(false) })
  }

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsToolbar
        filter={filter}
        updatedAt={updatedAt}
        refresh={{ visible: isWorkspaceManager(activeWorkspace?.workspaceRole), pending: refresh.isPending, onClick: () => refresh.mutate() }}
        exportPdf={{ visible: canExport, pending: pdf.isPending, disabled: !hasData, onClick: handleExport }}
        report={{ visible: canExport && projectId !== null, pending: report.isPending, onClick: () => setReportOpen(true) }}
      />

      <AnalyticsBody query={query} showProject={projectId === null} sheetRef={sheetRef} />

      {projectId !== null && (
        <ReportModal open={isReportOpen} onClose={() => setReportOpen(false)} isGenerating={report.isPending} onGenerate={handleGenerateReport} />
      )}
    </div>
  )
}
