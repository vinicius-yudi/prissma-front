import { Loader, Mail, UserMinus, UserPlus, X } from "lucide-react"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"
import type { WorkspaceMember, WorkspaceRole } from "@/shared/types/workspace"

import { useWorkspaceTeam } from "./hooks/useWorkspaceTeam"

/**
 * Pessoas & papéis — NÍVEL 1, como o design sempre especificou (Telas §9).
 *
 * Lista a equipe da CONSTRUTORA (workspace_members), não de uma obra. Clientes
 * ficam de fora da lista (D1: cliente é membro com papel CLIENT — aparece nas
 * obras dele, não na equipe). O editor de permissões POR OBRA continua no
 * nível 2, dentro de Equipes.
 *
 * Só OWNER/ADMIN da conta veem ações; o gate real é o backend (hierarquia:
 * ADMIN não gerencia ADMIN/OWNER, ninguém se auto-remove).
 */

const INVITABLE_ROLES: Exclude<WorkspaceRole, "OWNER">[] = ["MEMBER", "ADMIN", "CLIENT"]

export function PessoasPage() {
  const { t } = useTranslation()
  const { user, activeWorkspace } = useAuth()
  const team = useWorkspaceTeam()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<Exclude<WorkspaceRole, "OWNER">>("MEMBER")
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null)

  const canManage =
    activeWorkspace?.workspaceRole === "OWNER" || activeWorkspace?.workspaceRole === "ADMIN"

  // D1: a tela de equipe filtra os clientes — eles pertencem à conta, mas não
  // são "equipe"; aparecem em cada obra da qual participam.
  const visibleMembers = team.members.filter((member) => member.role !== "CLIENT")

  async function handleInviteSubmit(event: FormEvent) {
    event.preventDefault()
    if (!inviteEmail.trim()) return
    await team.invite({
      email: inviteEmail.trim(),
      fullName: inviteName.trim() || undefined,
      role: inviteRole,
    })
    setInviteOpen(false)
    setInviteEmail("")
    setInviteName("")
    setInviteRole("MEMBER")
  }

  function handleConfirmRemove() {
    if (!memberToRemove) return
    team.remove(memberToRemove.id)
    setMemberToRemove(null)
  }

  /** O backend também bloqueia — aqui só evitamos oferecer o botão inútil. */
  function canManageTarget(member: WorkspaceMember): boolean {
    if (!canManage) return false
    if (member.userId === user?.id) return false
    if (member.role === "OWNER") return false
    if (activeWorkspace?.workspaceRole === "ADMIN" && member.role === "ADMIN") return false
    return true
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-on-surface">
              {t("workspace.team.title")}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{t("workspace.team.hint")}</p>
          </div>

          {canManage && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus size={16} />
              {t("workspace.team.invite")}
            </Button>
          )}
        </div>

        {team.isLoading && (
          <div className="mt-5 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
            ))}
          </div>
        )}

        {team.isError && <p className="mt-6 text-sm text-danger">{t("workspace.team.error")}</p>}

        {!team.isLoading && !team.isError && visibleMembers.length === 0 && (
          <p className="mt-6 text-sm text-on-surface-variant">{t("workspace.team.empty")}</p>
        )}

        <ul className="mt-4 divide-y divide-outline-variant">
          {visibleMembers.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                {(member.name ?? member.email ?? "?").slice(0, 2).toUpperCase()}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-on-surface">
                  {member.name ?? member.email}
                  {!member.active && (
                    <span className="ml-2 rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-medium text-on-surface-faint">
                      {t("workspace.team.inactive")}
                    </span>
                  )}
                  {member.active && !member.acceptedAt && (
                    <span className="ml-2 rounded-full bg-tint px-2 py-0.5 text-[10px] font-medium text-gold-bright">
                      {t("workspace.team.pending")}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-on-surface-variant">
                  {member.email}
                </span>
              </span>

              {canManageTarget(member) ? (
                <span className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    disabled={team.isMutating}
                    aria-label={t("workspace.team.changeRole")}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                      team.changeRole({ memberId: member.id, role: event.currentTarget.value })
                    }
                  >
                    {INVITABLE_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {t(`workspace.roles.${role}`)}
                      </option>
                    ))}
                  </Select>

                  {member.active && (
                    <button
                      type="button"
                      title={t("workspace.team.deactivate")}
                      disabled={team.isMutating}
                      onClick={() => team.deactivate(member.id)}
                      className="flex size-8 cursor-pointer items-center justify-center rounded-full text-on-surface-faint transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <UserMinus size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    title={t("workspace.team.remove")}
                    disabled={team.isMutating}
                    onClick={() => setMemberToRemove(member)}
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full text-on-surface-faint transition-colors hover:bg-danger-bg hover:text-danger"
                  >
                    <X size={15} />
                  </button>
                </span>
              ) : (
                <span className="rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
                  {t(`workspace.roles.${member.role}`)}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Convite */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={t("workspace.team.inviteTitle")}
        description={t("workspace.team.hint")}
        icon={<Mail size={20} />}
        size="sm"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 px-6 pb-6">
          <Input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t("workspace.team.inviteEmail")}
            aria-label={t("workspace.team.inviteEmail")}
          />
          <Input
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder={t("workspace.team.inviteName")}
            aria-label={t("workspace.team.inviteName")}
          />
          <Select
            value={inviteRole}
            aria-label={t("workspace.team.inviteRole")}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setInviteRole(event.currentTarget.value as Exclude<WorkspaceRole, "OWNER">)
            }
          >
            {INVITABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`workspace.roles.${role}`)}
              </option>
            ))}
          </Select>

          <Button type="submit" disabled={team.isInviting} className="w-full">
            {team.isInviting && <Loader size={16} className="animate-spin" />}
            {team.isInviting ? t("workspace.team.inviteSending") : t("workspace.team.inviteSend")}
          </Button>
        </form>
      </Modal>

      {/* Remoção */}
      <Modal
        open={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title={t("workspace.team.remove")}
        description={t("workspace.team.removeConfirm", {
          name: memberToRemove?.name ?? memberToRemove?.email ?? "",
        })}
        icon={<X size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="flex gap-3 px-6 pb-6">
          <Button variant="outline" onClick={() => setMemberToRemove(null)}>
            {t("obra.equipes.actions.cancel")}
          </Button>
          <Button variant="destructive" onClick={handleConfirmRemove} disabled={team.isMutating}>
            {t("workspace.team.remove")}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
