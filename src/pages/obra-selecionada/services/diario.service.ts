import { api } from "@/lib/api"

import type { CreateDiarioEntryRequest, DiarioEntry } from "../types/diario"

export function getDiarioEntries(projectId: number): Promise<DiarioEntry[]> {
  return api.get<DiarioEntry[]>(`/projects/${projectId}/diary`)
}

export function createDiarioEntry(
  projectId: number,
  payload: CreateDiarioEntryRequest,
): Promise<DiarioEntry> {
  return api.post<DiarioEntry>(`/projects/${projectId}/diary`, payload)
}