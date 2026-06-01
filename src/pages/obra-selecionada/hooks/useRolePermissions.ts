import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"

import {
  getRolePermissions,
  updateRolePermissions,
  type ProjectPermission,
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

export function useUpdateRolePermissions(projectId: number) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({
      role,
      permissions,
    }: {
      role: ProjectRole
      permissions: ProjectPermission[]
    }) => updateRolePermissions(projectId, role, permissions),
    onSuccess: (_, { role }) => {
      queryClient.invalidateQueries({ queryKey: rolePermissionsKey(projectId, role) })
      toast.success("Permissões atualizadas com sucesso!")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar permissões")
    },
  })

  return {
    updatePermissions: mutation.mutate,
    updatePermissionsAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  }
}
