import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { addEquipeMember, getAvailableUsers, getEquipeMembers, removeEquipeMember, updateMemberRole } from "../services/equipes.service"
import type { AddMemberRequest, ConstructionProjectMember, ProjectRoleInRequest } from "../types/equipes"
import { obraMembersKey } from "./useObraMembers"

interface RoleChange {
  member: ConstructionProjectMember
  role: ProjectRoleInRequest
}

/**
 * Equipe da obra: membros, quem da conta pode entrar, e as três escritas —
 * adicionar, trocar o papel e remover.
 */
export function useEquipes(obraId: number, usersEnabled = false) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const membersKey = obraMembersKey(obraId)

  const membersQuery = useQuery({ queryKey: membersKey, queryFn: () => getEquipeMembers(obraId) })
  const usersQuery = useQuery({
    queryKey: ["availableUsers"],
    queryFn: getAvailableUsers,
    // /workspaces/members é vetado a CLIENT no backend: só busca quando o
    // modal abre e quem abre pode gerenciar membros.
    enabled: usersEnabled,
  })

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: membersKey })
  }

  const addMutation = useMutation({
    mutationFn: (data: AddMemberRequest) => addEquipeMember(obraId, data),
    onSuccess: (added) => {
      invalidate()
      toast.success(t("obra.equipes.toasts.added", { name: added.user.name }))
    },
    onError: (error: Error) => toast.error(error.message || t("obra.equipes.toasts.addError")),
  })

  const roleMutation = useMutation({
    mutationFn: ({ member, role }: RoleChange) => updateMemberRole(obraId, member.id, role),
    onSuccess: (_data, { member, role }) => {
      invalidate()
      toast.success(t("obra.equipes.toasts.roleChanged", { name: member.user.name.split(" ")[0], role: t(`roles.${role}`).toLowerCase() }))
    },
    onError: (error: Error) => toast.error(error.message || t("obra.equipes.toasts.roleError")),
  })

  const removeMutation = useMutation({
    mutationFn: (member: ConstructionProjectMember) => removeEquipeMember(obraId, member.id),
    onSuccess: (_data, member) => {
      invalidate()
      toast.success(t("obra.equipes.toasts.removed", { name: member.user.name }))
    },
    onError: (error: Error) => toast.error(error.message || t("obra.equipes.toasts.removeError")),
  })

  const memberIds = new Set((membersQuery.data ?? []).map((m) => m.user.id))

  return {
    members: membersQuery.data ?? [],
    isLoadingMembers: membersQuery.isLoading,
    /** Quem da conta ainda não está na obra. */
    candidates: (usersQuery.data ?? []).filter((user) => !memberIds.has(user.id)),
    isLoadingUsers: usersQuery.isLoading,
    addAsync: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    changeRole: (member: ConstructionProjectMember, role: ProjectRoleInRequest) => roleMutation.mutate({ member, role }),
    removeAsync: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  }
}
