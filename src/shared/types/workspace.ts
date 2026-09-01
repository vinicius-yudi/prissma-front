export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "CLIENT"

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
  role: Exclude<WorkspaceRole, "OWNER">
}

export interface AcceptInviteRequest {
  fullName?: string
  password?: string
}
