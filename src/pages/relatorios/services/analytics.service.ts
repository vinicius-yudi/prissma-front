import { api, buildHeaders } from "@/lib/api"

import type { AnalyticsDashboard, AnalyticsProjectOption } from "../types/analytics"

const BASE_URL = "/api"

/** Sem obra, o backend consolida todas as obras que o usuário alcança no workspace. */
export async function getAnalyticsDashboard(projectId: number | null): Promise<AnalyticsDashboard> {
  const query = projectId === null ? "" : `?projectId=${projectId}`
  return api.get<AnalyticsDashboard>(`/analytics/dashboard${query}`)
}

export async function getAnalyticsProjects(): Promise<AnalyticsProjectOption[]> {
  return api.get<AnalyticsProjectOption[]>("/analytics/projects")
}

/** Recarga do data warehouse sob demanda. Só OWNER/ADMIN do workspace (403 aos demais). */
export async function refreshAnalytics(): Promise<void> {
  return api.post<void>("/analytics/refresh")
}

export interface ReportPeriod {
  /** `yyyy-MM-dd`; vazio deixa o backend assumir o início planejado da obra. */
  from: string
  /** `yyyy-MM-dd`; vazio assume hoje. */
  to: string
}

export interface ReportFile {
  blob: Blob
  fileName: string
}

const FILE_NAME = /filename="?([^";]+)"?/

/**
 * Relatório da obra em PDF (RF16), gerado no servidor.
 *
 * Fetch cru porque a resposta é binária. O `Accept` não pode ser só
 * `application/pdf`: o erro volta em texto, e um Accept restrito o
 * transformaria em 406 (ver `postman/relatorio.http` no backend).
 */
export async function downloadProjectReport(projectId: number, period: ReportPeriod): Promise<ReportFile> {
  const params = new URLSearchParams()
  if (period.from) params.set("from", period.from)
  if (period.to) params.set("to", period.to)
  const query = params.size > 0 ? `?${params.toString()}` : ""

  const response = await fetch(`${BASE_URL}/projects/${projectId}/report${query}`, {
    headers: { ...buildHeaders(), Accept: "application/pdf, */*" },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Erro ${response.status}`)
  }

  const disposition = response.headers.get("content-disposition") ?? ""
  const fileName = FILE_NAME.exec(disposition)?.[1] ?? `relatorio-obra-${projectId}.pdf`
  return { blob: await response.blob(), fileName }
}
