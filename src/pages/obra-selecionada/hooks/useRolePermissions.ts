import { useQuery } from "@tanstack/react-query"

import {
  getRolePermissions,
  type ProjectRole,
} from "../services/projectPermissions.service"

export function rolePermissionsKey(projectId: number, role: ProjectRole) {
  return ["rolePermissions", projectId, role] as const
}

export function useRolePermissions(projectId: number, role: ProjectRole | null) {
  const query = useQuery({
    queryKey: ["rolePermissions", projectId, role],
    queryFn: () => getRolePermissions(projectId, role as ProjectRole),
    enabled: projectId > 0 && role !== null,
  })

  return {
    permissions: query.data?.permissions ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
