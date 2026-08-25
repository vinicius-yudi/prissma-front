import { useState } from "react"

import { ProjectRole } from "../services/projectPermissions.service"
import type { ProjectPermission } from "../services/projectPermissions.service"
import type { ConstructionProjectMember } from "../types/equipes"
import { useObraMembers } from "./useObraMembers"
import { useRolePermissions } from "./useRolePermissions"

/**
 * Dados de Pessoas & papéis: vinculados à obra e permissões do papel escolhido.
 *
 * O papel selecionado é estado de tela, mas quem busca as permissões dele é
 * este hook — o componente só recebe a lista pronta.
 */

interface UsePessoasResult {
  members: ConstructionProjectMember[] | undefined
  isLoadingMembers: boolean
  isErrorMembers: boolean

  role: ProjectRole
  setRole: (role: ProjectRole) => void
  permissions: ProjectPermission[]
  isLoadingPermissions: boolean
  isErrorPermissions: boolean
}

export function usePessoas(projectId: number): UsePessoasResult {
  const [role, setRole] = useState<ProjectRole>(ProjectRole.ENGINEER)

  const membersQuery = useObraMembers(projectId)

  const { permissions, isLoading, isError } = useRolePermissions(projectId, role)

  return {
    members: membersQuery.members,
    isLoadingMembers: membersQuery.isLoading,
    isErrorMembers: membersQuery.isError,

    role,
    setRole,
    permissions,
    isLoadingPermissions: isLoading,
    isErrorPermissions: isError,
  }
}
