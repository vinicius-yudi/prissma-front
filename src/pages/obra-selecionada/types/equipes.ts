import type { Role } from "@/shared/types/user"
import type { WorkspaceRole } from "@/shared/types/workspace"

/** Usuário como vem em /projects/{id}/members — `role` é o papel GLOBAL da conta. */
export interface User {
  id: number
  name: string
  email: string
  role: Role
  avatar?: string
}

/** Membro da conta elegível para entrar na equipe (vem de /workspaces/members). */
export interface AvailableUser {
  id: number
  name: string
  email: string
  role: WorkspaceRole
  avatar?: string
}

/** Papel NA OBRA. Espelha o enum ProjectRole do backend. */
export const RoleInProject = {
  OWNER: 'OWNER',
  ENGINEER: 'ENGINEER',
  ARCHITECT: 'ARCHITECT',
  FOREMAN: 'FOREMAN',
  USER: 'USER',
} as const

export type RoleInProject = (typeof RoleInProject)[keyof typeof RoleInProject]

/** OWNER é atribuído pelo backend ao criador da obra; ninguém é adicionado como OWNER. */
export type ProjectRoleInRequest = Exclude<RoleInProject, typeof RoleInProject.OWNER>

export interface ConstructionProjectMember {
  id: number
  constructionProjectId: number
  user: User
  roleInProject: RoleInProject
  membershipStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE'
  joinedAt: string
}

export interface AddMemberRequest {
  userId: number
  roleInProject: ProjectRoleInRequest
}

export interface AddMemberResponse {
  id: number
  constructionProjectId: number
  user: User
  roleInProject: RoleInProject
  membershipStatus: string
  joinedAt: string
}
