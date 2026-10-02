import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import {
  EDITABLE_PROJECT_ROLES,
  getRolePermissions,
  updateRolePermissions,
  type ProjectPermission,
  type ProjectRole,
} from "../services/projectPermissions.service"
import { rolePermissionsKey } from "./useRolePermissions"

type Matrix = Record<ProjectRole, Set<ProjectPermission>>

function emptyMatrix(): Matrix {
  return { OWNER: new Set(), ENGINEER: new Set(), ARCHITECT: new Set(), FOREMAN: new Set() }
}

function sameSet(a: Set<ProjectPermission>, b: Set<ProjectPermission>): boolean {
  return a.size === b.size && [...a].every((p) => b.has(p))
}

/**
 * Matriz papéis × permissões da obra, editável. O backend guarda por papel
 * (GET/PUT `/roles/{role}/permissions`), então a tela carrega os quatro e, ao
 * salvar, só manda os papéis que mudaram. As marcações ficam num rascunho até
 * salvar ou descartar.
 */
export function usePermissionMatrix(projectId: number, enabled: boolean) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queries = useQueries({
    queries: EDITABLE_PROJECT_ROLES.map((role) => ({
      queryKey: rolePermissionsKey(projectId, role),
      queryFn: () => getRolePermissions(projectId, role),
      enabled: enabled && projectId > 0,
    })),
  })
  const [draft, setDraft] = useState<Matrix | null>(null)

  const saved = emptyMatrix()
  EDITABLE_PROJECT_ROLES.forEach((role, i) => {
    saved[role] = new Set(queries[i]?.data?.permissions ?? [])
  })
  const current = draft ?? saved
  const dirtyRoles = EDITABLE_PROJECT_ROLES.filter((role) => !sameSet(current[role], saved[role]))

  const mutation = useMutation({
    mutationFn: (roles: ProjectRole[]) =>
      Promise.all(roles.map((role) => updateRolePermissions(projectId, role, [...current[role]]))),
    onSuccess: (_data, roles) => {
      for (const role of roles) void queryClient.invalidateQueries({ queryKey: rolePermissionsKey(projectId, role) })
      setDraft(null)
      toast.success(t("obra.equipes.permissions.saved"))
    },
    onError: (error: Error) => toast.error(error.message || t("obra.equipes.permissions.saveError")),
  })

  function toggle(role: ProjectRole, permission: ProjectPermission) {
    const next = { ...current, [role]: new Set(current[role]) }
    if (next[role].has(permission)) next[role].delete(permission)
    else next[role].add(permission)
    setDraft(next)
  }

  return {
    matrix: current,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
    isDirty: dirtyRoles.length > 0,
    isSaving: mutation.isPending,
    toggle,
    save: () => mutation.mutate(dirtyRoles),
    discard: () => setDraft(null),
  }
}
