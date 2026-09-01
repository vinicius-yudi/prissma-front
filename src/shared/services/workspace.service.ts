import { api } from "@/lib/api"
import type {
  AcceptInviteRequest,
  InviteMemberRequest,
  MemberInviteResponse,
  Workspace,
  WorkspaceMember,
} from "@/shared/types/workspace"

export function getWorkspaces(): Promise<Workspace[]> {
  return api.get<Workspace[]>("/workspaces")
}

export function createWorkspace(name: string): Promise<Workspace> {
  return api.post<Workspace>("/workspaces", { name })
}

/** Devolve um token novo com os claims do workspace alvo. */
export function switchWorkspace(id: number): Promise<{ token: string }> {
  return api.post<{ token: string }>(`/workspaces/${id}/switch`)
}

export function getWorkspaceMembers(): Promise<WorkspaceMember[]> {
  return api.get<WorkspaceMember[]>("/workspaces/members")
}

export function inviteMember(request: InviteMemberRequest): Promise<MemberInviteResponse> {
  return api.post<MemberInviteResponse>("/workspaces/members/invite", request)
}

/** Rota pública — o convidado pode ainda não ter conta. */
export function acceptInvite(token: string, request: AcceptInviteRequest): Promise<void> {
  return api.patch<void>(`/workspaces/invites/${encodeURIComponent(token)}/accept`, request, {
    skipAuthRedirect: true,
  })
}

export function updateMemberRole(memberId: number, role: string): Promise<WorkspaceMember> {
  return api.patch<WorkspaceMember>(`/workspaces/members/${memberId}`, { role })
}

export function deactivateMember(memberId: number): Promise<WorkspaceMember> {
  return api.patch<WorkspaceMember>(`/workspaces/members/${memberId}/deactivate`)
}

export function removeMember(memberId: number): Promise<void> {
  return api.delete<void>(`/workspaces/members/${memberId}`)
}
