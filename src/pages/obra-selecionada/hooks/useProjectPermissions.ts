import { useQuery } from "@tanstack/react-query"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"

import {
  ProjectRole,
  type ProjectPermission,
} from "../services/projectPermissions.service"
import type { RoleInProject } from "../types/equipes"
import { useObraMembers } from "./useObraMembers"
import { useRolePermissions } from "./useRolePermissions"

// Member roles that map 1:1 to a role whose permissions live in the backend.
// CLIENT/USER members have no manageable role, so they resolve to null.
const PROJECT_ROLE_BY_MEMBER_ROLE = new Map<RoleInProject, ProjectRole>([
  ["OWNER", ProjectRole.OWNER],
  ["ENGINEER", ProjectRole.ENGINEER],
  ["ARCHITECT", ProjectRole.ARCHITECT],
  ["FOREMAN", ProjectRole.FOREMAN],
])

export interface UseProjectPermissionsResult {
  isAdmin: boolean
  roleInProject: RoleInProject | null
  isLoading: boolean
  can: (permission: ProjectPermission) => boolean
}

export function useProjectPermissions(projectId: number): UseProjectPermissionsResult {
  const isValid = projectId > 0

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
  })

  const membersQuery = useObraMembers(projectId, { enabled: isValid })

  const isAdmin = meQuery.data?.role === GlobalRole.ADMIN

  const roleInProject =
    membersQuery.members?.find(m => m.user.id === meQuery.data?.id)?.roleInProject ?? null

  const projectRole = roleInProject
    ? PROJECT_ROLE_BY_MEMBER_ROLE.get(roleInProject) ?? null
    : null

  // Admins bypass everything, so skip the per-role lookup for them.
  const { permissions, isLoading: isLoadingPermissions } = useRolePermissions(
    projectId,
    isAdmin ? null : projectRole,
  )

  const isLoading = meQuery.isLoading || membersQuery.isLoading || isLoadingPermissions

  function can(permission: ProjectPermission): boolean {
    if (isAdmin) return true
    // Fail-open enquanto carrega: esconder o botão e reexibi-lo meio segundo
    // depois faz a barra de ações piscar em toda entrada de tela. O gate real
    // é o backend, que recusa a ação com 403 mesmo se o botão aparecer.
    //
    // Não vaza permissão para quem não tem: membro sem papel gerenciável
    // (cliente) e não-membro resolvem `projectRole` como null, o que desliga a
    // query — `isLoading` fica false e `permissions` fica vazio.
    if (isLoading) return true
    return permissions.includes(permission)
  }

  return {
    isAdmin,
    roleInProject,
    isLoading,
    can,
  }
}
