import { api } from "@/lib/api"

export const ProjectPermission = {
  VIEW_PROJECT: "VIEW_PROJECT",
  MANAGE_MEMBERS: "MANAGE_MEMBERS",
  MANAGE_BUDGET: "MANAGE_BUDGET",
  MANAGE_STAGES: "MANAGE_STAGES",
  MANAGE_TEAMS: "MANAGE_TEAMS",
  MANAGE_TASKS: "MANAGE_TASKS",
  MANAGE_ATTACHMENTS: "MANAGE_ATTACHMENTS",
} as const

export type ProjectPermission = (typeof ProjectPermission)[keyof typeof ProjectPermission]

// Roles whose permissions can be inspected/edited via the roles endpoints.
export const ProjectRole = {
  OWNER: "OWNER",
  ENGINEER: "ENGINEER",
  ARCHITECT: "ARCHITECT",
  FOREMAN: "FOREMAN",
} as const

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole]

export const ALL_PROJECT_PERMISSIONS: ProjectPermission[] = [
  ProjectPermission.VIEW_PROJECT,
  ProjectPermission.MANAGE_MEMBERS,
  ProjectPermission.MANAGE_BUDGET,
  ProjectPermission.MANAGE_STAGES,
  ProjectPermission.MANAGE_TEAMS,
  ProjectPermission.MANAGE_TASKS,
  ProjectPermission.MANAGE_ATTACHMENTS,
]

export const EDITABLE_PROJECT_ROLES: ProjectRole[] = [
  ProjectRole.OWNER,
  ProjectRole.ENGINEER,
  ProjectRole.ARCHITECT,
  ProjectRole.FOREMAN,
]

export interface RolePermissionsResponse {
  role: string
  permissions: ProjectPermission[]
}

export async function getRolePermissions(
  projectId: number,
  role: ProjectRole,
): Promise<RolePermissionsResponse> {
  return api.get<RolePermissionsResponse>(
    `/projects/${projectId}/roles/${role}/permissions`,
  )
}

export async function updateRolePermissions(
  projectId: number,
  role: ProjectRole,
  permissions: ProjectPermission[],
): Promise<RolePermissionsResponse> {
  return api.put<RolePermissionsResponse>(
    `/projects/${projectId}/roles/${role}/permissions`,
    { permissions },
  )
}
