import { UserMinus, X } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { IconButton } from "@/shared/components/ui/icon-button/IconButton"
import { Select } from "@/shared/components/ui/select/Select"
import type { InvitableWorkspaceRole, WorkspaceMember } from "@/shared/types/workspace"

interface MemberRowProps {
  member: WorkspaceMember
  /** O papel de quem vê permite mexer neste membro. */
  canManage: boolean
  roles: InvitableWorkspaceRole[]
  isMutating: boolean
  onChangeRole: (memberId: number, role: string) => void
  onDeactivate: (memberId: number) => void
  onRemove: (member: WorkspaceMember) => void
}

/**
 * Pessoa da equipe da conta: avatar, nome, e-mail e papel. Para quem gerencia,
 * o papel é um `select` e aparecem desativar e remover; para os outros, o papel
 * é texto (DS v2, Role).
 */
export function MemberRow({
  member,
  canManage,
  roles,
  isMutating,
  onChangeRole,
  onDeactivate,
  onRemove,
}: MemberRowProps) {
  const { t } = useTranslation()
  const displayName = member.name ?? member.email

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3 [&+&]:shadow-[inset_0_1px_0_var(--border)]">
      <Avatar name={displayName} size={36} />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-ink">{displayName}</span>
          {!member.active && (
            <span className="rounded-pill bg-raised px-2 py-0.5 text-[11px] font-semibold text-ink-2">
              {t("workspace.team.inactive")}
            </span>
          )}
          {member.active && !member.acceptedAt && (
            <span className="rounded-pill bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-gold-hi">
              {t("workspace.team.pending")}
            </span>
          )}
        </span>
        <span className="block truncate text-[12.5px] text-meta">{member.email}</span>
      </span>

      {canManage ? (
        <span className="flex items-center gap-1">
          <div className="w-40">
            <Select
              value={member.role}
              disabled={isMutating}
              aria-label={t("workspace.team.changeRole")}
              className="h-9 text-[13px]"
              onChange={(event: ChangeEvent<HTMLSelectElement>) => onChangeRole(member.id, event.currentTarget.value)}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(`workspace.roles.${role}`)}
                </option>
              ))}
            </Select>
          </div>

          {member.active && (
            <IconButton label={t("workspace.team.deactivate")} disabled={isMutating} onClick={() => onDeactivate(member.id)}>
              <UserMinus size={15} />
            </IconButton>
          )}

          <IconButton
            label={t("workspace.team.remove")}
            disabled={isMutating}
            onClick={() => onRemove(member)}
            className="hover:bg-danger-soft hover:text-danger"
          >
            <X size={15} />
          </IconButton>
        </span>
      ) : (
        <span className="inline-flex h-[26px] items-center rounded-pill bg-raised px-2.5 text-[12px] font-semibold text-ink-2 hairline">
          {t(`workspace.roles.${member.role}`)}
        </span>
      )}
    </li>
  )
}
