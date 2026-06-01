export interface User {
  id: number
  name: string
  email: string
  role: string
  avatar?: string
}

export type RoleInProject = 'OWNER' | 'ARCHITECT' | 'ENGINEER' | 'FOREMAN' | 'CLIENT'

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
  roleInProject: RoleInProject
}

export interface AddMemberResponse {
  id: number
  constructionProjectId: number
  user: User
  roleInProject: RoleInProject
  membershipStatus: string
  joinedAt: string
}
