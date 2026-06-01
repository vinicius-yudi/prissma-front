import { api } from "@/lib/api"
import type { AddMemberRequest, AddMemberResponse, ConstructionProjectMember } from "../types/equipes"

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

export async function getAvailableUsers(): Promise<any[]> {
  return api.get<any[]>("/users")
}
