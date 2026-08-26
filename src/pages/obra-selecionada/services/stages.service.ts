import { api } from "@/lib/api"
import type { EtapaStatus } from "@/pages/projetos/types"

export interface Stage {
  id: number
  constructionProjectId: number
  name: string
  description: string | null
  displayOrder: number
  status: EtapaStatus
  plannedStartDate: string | null
  plannedEndDate: string | null
  actualStartDate: string | null
  actualEndDate: string | null
  createdAt: string
  updatedAt: string
}

export interface StageRequest {
  name: string
  description?: string | null
  displayOrder: number
  status: EtapaStatus
  plannedStartDate?: string | null
  plannedEndDate?: string | null
  actualStartDate?: string | null
  actualEndDate?: string | null
}

export async function listStages(projectId: number): Promise<Stage[]> {
  return api.get<Stage[]>(`/projects/${projectId}/stages`)
}

export async function getStage(stageId: number): Promise<Stage> {
  return api.get<Stage>(`/stages/${stageId}`)
}

export async function createStage(projectId: number, payload: StageRequest): Promise<Stage> {
  return api.post<Stage>(`/projects/${projectId}/stages`, payload)
}

export async function updateStage(stageId: number, payload: StageRequest): Promise<Stage> {
  return api.patch<Stage>(`/stages/${stageId}`, payload)
}

export async function deleteStage(stageId: number): Promise<void> {
  return api.delete<void>(`/stages/${stageId}`)
}

export interface StageReorderResponse {
  message: string
  stages: Stage[]
}

export async function reorderStages(
  projectId: number,
  orderedIds: number[],
): Promise<StageReorderResponse> {
  return api.post<StageReorderResponse>(`/projects/${projectId}/stages/reorder`, orderedIds)
}
