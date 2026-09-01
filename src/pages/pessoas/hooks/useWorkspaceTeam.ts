import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next"

import {
  deactivateMember,
  getWorkspaceMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/shared/services/workspace.service"
import type { InviteMemberRequest } from "@/shared/types/workspace"

const TEAM_KEY = ["workspaceMembers"] as const

/**
 * Equipe da CONSTRUTORA (workspace_members) — não confundir com a equipe de
 * uma obra (Equipes, nível 2). As regras de hierarquia (ADMIN não gerencia
 * ADMIN/OWNER, ninguém se auto-remove) são do backend; a UI só esconde o que
 * o papel da conta não alcança.
 */
export function useWorkspaceTeam() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const membersQuery = useQuery({
    queryKey: TEAM_KEY,
    queryFn: getWorkspaceMembers,
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: TEAM_KEY })
  }

  const inviteMutation = useMutation({
    mutationFn: (request: InviteMemberRequest) => inviteMember(request),
    onSuccess: (response) => {
      toast.success(t("workspace.team.inviteSent", { email: response.invitedEmail }))
    },
    onError: (error: Error) => toast.error(error.message || t("workspace.team.inviteError")),
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: string }) =>
      updateMemberRole(memberId, role),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message || t("workspace.team.actionError")),
  })

  const deactivateMutation = useMutation({
    mutationFn: (memberId: number) => deactivateMember(memberId),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message || t("workspace.team.actionError")),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: number) => removeMember(memberId),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message || t("workspace.team.actionError")),
  })

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    invite: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    changeRole: roleMutation.mutate,
    deactivate: deactivateMutation.mutate,
    remove: removeMutation.mutate,
    isMutating: roleMutation.isPending || deactivateMutation.isPending || removeMutation.isPending,
  }
}
