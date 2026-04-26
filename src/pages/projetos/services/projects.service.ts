import { api } from "@/lib/api"

import type { Project, ProjectStatus } from "@/shared/types/project"
import type { ProjetoAcompanhamento } from "../types"

export interface UpdateProjectPayload {
  title?: string
  address?: string
  projectType?: string
  category?: string
  landArea?: number
  builtArea?: number
  status?: ProjectStatus
  plannedStartDate?: string
  plannedEndDate?: string
}

export async function listProjects(): Promise<Project[]> {
  return api.get<Project[]>("/projects")
}

export async function getProject(id: number): Promise<Project> {
  return api.get<Project>(`/projects/${id}`)
}

export async function updateProject(id: number, payload: UpdateProjectPayload): Promise<Project> {
  return api.patch<Project>(`/projects/${id}`, payload)
}

export async function deleteProject(id: number): Promise<void> {
  return api.delete<void>(`/projects/${id}`)
}

export async function getProjectAcompanhamento(id: number): Promise<ProjetoAcompanhamento> {
  return api.get<ProjetoAcompanhamento>(`/projects/${id}/acompanhamento`)
}
