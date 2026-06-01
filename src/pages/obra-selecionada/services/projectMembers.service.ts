import { api } from "@/lib/api"

export type ProjectRole = "OWNER" | "ENGINEER" | "ARCHITECT" | "FOREMAN"

export interface ProjectMember {
  userId: number
  roleInProject: ProjectRole
}

export async function listProjectMembers(projectId: number): Promise<ProjectMember[]> {
  return api.get<ProjectMember[]>(`/projects/${projectId}/members`)
}
