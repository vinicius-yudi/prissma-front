import { Download, FileText, Loader2, RefreshCw } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

interface Action {
  visible: boolean
  pending: boolean
  disabled?: boolean
  onClick: () => void
}

interface AnalyticsToolbarProps {
  /** Filtro de obra, no consolidado. */
  filter?: ReactNode
  /** Já formatado; `null` quando o DW nunca carregou. */
  updatedAt: string | null
  refresh: Action
  exportPdf: Action
  report: Action
}

/** Filtro e carimbo "Atualizado em" à esquerda; recarga e exports à direita. */
export function AnalyticsToolbar({ filter, updatedAt, refresh, exportPdf, report }: AnalyticsToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        {filter}
        <p className="t-data text-[12.5px] text-meta">{updatedAt ? t("relatorios.updatedAt", { date: updatedAt }) : t("relatorios.neverUpdated")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {refresh.visible && (
          <Button variant="ghost" size="sm" fullWidth={false} onClick={refresh.onClick} disabled={refresh.pending}>
            {refresh.pending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {t("relatorios.actions.refresh")}
          </Button>
        )}
        {exportPdf.visible && (
          <Button variant="outline" size="sm" fullWidth={false} onClick={exportPdf.onClick} disabled={exportPdf.pending || exportPdf.disabled}>
            {exportPdf.pending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {t(exportPdf.pending ? "relatorios.actions.exporting" : "relatorios.actions.export")}
          </Button>
        )}
        {report.visible && (
          <Button variant="outline" size="sm" fullWidth={false} onClick={report.onClick} disabled={report.pending}>
            <FileText size={14} />
            {t("relatorios.actions.report")}
          </Button>
        )}
      </div>
    </div>
  )
}
