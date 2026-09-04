import { api } from "@/lib/api"
import { getWorkspaceMembers } from "@/shared/services/workspace.service"
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
  // Quem pode entrar numa obra é quem já pertence à conta ativa
  // (/workspaces/members). OWNER/ADMIN ficam de fora: já alcançam todas as
  // obras do workspace, adicioná-los à equipe seria redundante.
  const members = await getWorkspaceMembers()
  return members
    .filter((m) => m.active && (m.role === "MEMBER" || m.role === "CLIENT"))
    .map((m) => ({
      id: m.userId,
      name: m.name ?? m.email ?? "",
      email: m.email ?? "",
      role: m.role,
    }))
}
