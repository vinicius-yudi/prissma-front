import { api } from "@/lib/api"
import type { AddMemberRequest, AddMemberResponse, ConstructionProjectMember, User } from "../types/equipes"

export async function getEquipeMembers(obraId: number): Promise<ConstructionProjectMember[]> {
  return api.get<ConstructionProjectMember[]>(`/projects/${obraId}/members`)
}

export async function addEquipeMember(
  obraId: number,
  data: AddMemberRequest
): Promise<AddMemberResponse> {
  return api.post<AddMemberResponse>(`/projects/${obraId}/members`, data)
}

export async function removeEquipeMember(obraId: number, memberId: number): Promise<void> {
  return api.delete<void>(`/projects/${obraId}/members/${memberId}`)
}

export async function getAvailableUsers(): Promise<User[]> {
  // /users is admin-only on the backend and returns 401 for other roles.
  // skipAuthRedirect prevents that authorization 401 from logging the user out;
  // the query just errors and the picker shows an empty/error state instead.
  return api.get<User[]>("/users", { skipAuthRedirect: true })
}
