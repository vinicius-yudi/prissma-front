import { api } from "@/lib/api"

import type { CreateDiarioEntryRequest, DiarioEntry, DiarioPage } from "../types/diario"

export function getDiarioEntries(projectId: number, page = 0, size = 20): Promise<DiarioPage | DiarioEntry[]> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return api.get<DiarioPage | DiarioEntry[]>(`/projects/${projectId}/diary-entries?${params.toString()}`)
}

export function createDiarioEntry(
  projectId: number,
  payload: CreateDiarioEntryRequest,
): Promise<DiarioEntry> {
  return api.post<DiarioEntry>(`/projects/${projectId}/diary-entries`, payload)
}

export function deleteDiarioEntry(projectId: number, id: number): Promise<void> {
  return api.delete<void>(`/projects/${projectId}/diary-entries/${id}`)
}