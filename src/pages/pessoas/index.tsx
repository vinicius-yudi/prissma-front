import { UserPlus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { PageHeader } from "@/shared/components/ui/page-header/PageHeader"
import { WorkspaceRole, isWorkspaceManager } from "@/shared/types/workspace"
import type { InvitableWorkspaceRole, WorkspaceMember } from "@/shared/types/workspace"

import { InviteMemberModal } from "./components/InviteMemberModal"
import { MemberRow } from "./components/MemberRow"
import { RemoveMemberModal } from "./components/RemoveMemberModal"
import { useWorkspaceTeam } from "./hooks/useWorkspaceTeam"

/**
 * Pessoas & papéis — NÍVEL 1: a equipe da CONSTRUTORA (workspace_members),
 * não de uma obra. Clientes ficam de fora (D1: aparecem nas obras deles). O
 * editor de permissões por obra continua em Equipes, dentro da obra.
 *
 * Só OWNER/ADMIN da conta veem ações; o gate real é o backend (ADMIN não
 * gerencia ADMIN/OWNER, ninguém se auto-remove).
 */

const INVITABLE_ROLES: InvitableWorkspaceRole[] = [WorkspaceRole.MEMBER, WorkspaceRole.ADMIN, WorkspaceRole.CLIENT]

const LOADING_ROWS = ["a", "b", "c"]

export function PessoasPage() {
  const { t } = useTranslation()
  const { user, activeWorkspace } = useAuth()
  const team = useWorkspaceTeam()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null)

  const canManage = isWorkspaceManager(activeWorkspace?.workspaceRole)
  const visibleMembers = team.members.filter((member) => member.role !== WorkspaceRole.CLIENT)

  usePrimaryAction(canManage ? { label: t("workspace.team.invite"), icon: UserPlus, onClick: () => setInviteOpen(true) } : null)

  /** O backend também bloqueia — aqui só evitamos oferecer o botão inútil. */
  function canManageTarget(member: WorkspaceMember): boolean {
    if (!canManage) return false
    if (member.userId === user?.id) return false
    if (member.role === WorkspaceRole.OWNER) return false
    if (activeWorkspace?.workspaceRole === WorkspaceRole.ADMIN && member.role === WorkspaceRole.ADMIN) return false
    return true
  }

  function handleConfirmRemove() {
    if (!memberToRemove) return
    team.remove(memberToRemove.id)
    setMemberToRemove(null)
  }

  return (
    <div>
      <PageHeader
        title={t("workspace.team.title")}
        subtitle={t("workspace.team.hint")}
        actions={
          canManage && (
            <Button fullWidth={false} onClick={() => setInviteOpen(true)} className="hidden lg:inline-flex">
              <UserPlus size={16} />
              {t("workspace.team.invite")}
            </Button>
          )
        }
      />

      {team.isError && <EmptyState title={t("workspace.team.error")} />}

      {!team.isError && (
        <section className="overflow-hidden rounded-lg bg-surface hairline">
          <header className="flex items-center justify-between px-5 pt-5 pb-3">
            <h2 className="t-section text-ink">{t("workspace.team.listTitle")}</h2>
            <span className="t-data text-meta">{visibleMembers.length}</span>
          </header>

          {team.isLoading && (
            <div className="space-y-2 px-5 pb-5" aria-busy="true">
              {LOADING_ROWS.map((key) => (
                <div key={key} className="h-14 animate-pulse rounded-[10px] bg-raised" />
              ))}
            </div>
          )}

          {!team.isLoading && visibleMembers.length === 0 && (
            <p className="px-5 pb-6 text-[14px] text-ink-2">{t("workspace.team.empty")}</p>
          )}

          <ul className="pb-2">
            {visibleMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                canManage={canManageTarget(member)}
                roles={INVITABLE_ROLES}
                isMutating={team.isMutating}
                onChangeRole={(memberId, role) => team.changeRole({ memberId, role })}
                onDeactivate={team.deactivate}
                onRemove={setMemberToRemove}
              />
            ))}
          </ul>
        </section>
      )}

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={INVITABLE_ROLES}
        isSending={team.isInviting}
        onInvite={team.invite}
      />

      <RemoveMemberModal
        member={memberToRemove}
        isRemoving={team.isMutating}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </div>
  )
}
