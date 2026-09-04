/**
 * Papel do usuário NA CONTA (workspace). Não confundir com RoleInProject,
 * o papel NA OBRA. Espelha o enum WorkspaceRole do backend.
 *
 * (Objeto `as const` em vez de `enum`: o tsconfig usa `erasableSyntaxOnly`.)
 */
export const WorkspaceRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
  CLIENT: "CLIENT",
} as const

export type WorkspaceRole = (typeof WorkspaceRole)[keyof typeof WorkspaceRole]

/** Papéis que podem ser atribuídos num convite — OWNER é único e nasce com a conta. */
export type InvitableWorkspaceRole = Exclude<WorkspaceRole, typeof WorkspaceRole.OWNER>

/**
 * OWNER/ADMIN mandam na conta: alcançam todas as obras sem vínculo de equipe
 * e gerenciam os demais membros.
 */
export function isWorkspaceManager(role: WorkspaceRole | null | undefined): boolean {
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN
}

export interface Workspace {
  id: number
  name: string
  document: string | null
  status: "ACTIVE" | "SUSPENDED"
  isPrimary: boolean
  isOwner: boolean
}

export interface WorkspaceMember {
  id: number
  userId: number
  name: string | null
  email: string | null
  role: WorkspaceRole
  active: boolean
  acceptedAt: string | null
}

export interface MemberInviteResponse {
  invitedEmail: string
  role: WorkspaceRole
  expiresAt: string
}

export interface InviteMemberRequest {
  email: string
  fullName?: string
  role: InvitableWorkspaceRole
}

export interface AcceptInviteRequest {
  fullName?: string
  password?: string
}
