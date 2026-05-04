import { api } from "@/lib/api"

import type { Project, ProjectStatus } from "@/shared/types/project"
import type { ProjetoAcompanhamento } from "../types"

export interface CreateProjectPayload {
  title: string
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  projectType: string
  category: string
  status: string
  landArea: number
  builtArea: number
  plannedStartDate: string
  plannedEndDate: string
}

export async function createProject(payload: CreateProjectPayload): Promise<void> {
  return api.post<void>("/projects", payload)
}

export interface UpdateProjectPayload {
  title?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
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
