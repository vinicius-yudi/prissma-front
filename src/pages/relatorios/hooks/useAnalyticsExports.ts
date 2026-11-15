import { useMutation } from "@tanstack/react-query"
import type { UseMutationResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { triggerFileDownload } from "@/pages/obra-selecionada/services/attachments.service"

import { downloadProjectReport, type ReportPeriod } from "../services/analytics.service"
import { exportDashboardPdf, type PdfHeader } from "../utils/dashboardPdf"

/** Relatório da obra (RF16), gerado no servidor para o período escolhido. */
export function useProjectReport(projectId: number | null): UseMutationResult<void, Error, ReportPeriod> {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async (period: ReportPeriod) => {
      if (projectId === null) return
      const { blob, fileName } = await downloadProjectReport(projectId, period)
      triggerFileDownload(blob, fileName)
    },
    onError: () => toast.error(t("relatorios.toasts.reportError")),
  })
}

interface DashboardPdfInput {
  sheet: HTMLElement
  header: PdfHeader
  fileName: string
}

/** PDF do dashboard como está na tela, montado no navegador. */
export function useDashboardPdf(): UseMutationResult<void, Error, DashboardPdfInput> {
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ sheet, header, fileName }: DashboardPdfInput) => exportDashboardPdf(sheet, header, fileName),
    onError: (error: Error) => {
      console.error(error)
      toast.error(t("relatorios.toasts.exportError"))
    },
  })
}
