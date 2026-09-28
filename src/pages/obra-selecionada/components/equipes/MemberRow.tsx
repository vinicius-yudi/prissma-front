import { Crown, X } from "lucide-react"
import { motion } from "motion/react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"

import { ASSIGNABLE_ROLES, MEMBERSHIP_PENDING } from "../../constants/equipes"
import { RoleInProject, type ConstructionProjectMember, type ProjectRoleInRequest } from "../../types/equipes"

const row = tv({
  base: "group list-none overflow-hidden transition-opacity",
  variants: { dimmed: { true: "opacity-40" } },
})

interface MemberRowProps {
  member: ConstructionProjectMember
  isMe: boolean
  /** Outro papel está em foco na matriz. */
  dimmed: boolean
  canManage: boolean
  onRoleChange: (member: ConstructionProjectMember, role: ProjectRoleInRequest) => void
  onRemove: (member: ConstructionProjectMember) => void
}

/**
 * Uma pessoa da obra. Quem gerencia troca o papel no próprio select; o
 * responsável (OWNER) e você mesmo não mudam de papel nem saem por aqui.
 */
export function MemberRow({ member, isMe, dimmed, canManage, onRoleChange, onRemove }: MemberRowProps) {
  const { t } = useTranslation()
  const owner = member.roleInProject === RoleInProject.OWNER
  const editable = canManage && !isMe && !owner

  return (
    <motion.li layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className={row({ dimmed })}>
      <div className="flex items-center gap-3.5 px-5 py-3.5 sm:px-6">
        <Avatar name={member.user.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-[14.5px] font-[600] text-ink">
            {member.user.name}
            {isMe && <span className="text-[12.5px] font-[450] text-meta">{t("obra.equipes.you")}</span>}
            {owner && <Crown size={13} className="flex-none text-gold-hi" aria-label={t("roles.OWNER")} />}
          </p>
          <p className="truncate text-[12.5px] text-meta">{member.user.email}</p>
        </div>
        {member.membershipStatus === MEMBERSHIP_PENDING && (
          <span className="hidden flex-none rounded-pill bg-warning-soft px-2.5 py-1 text-[11.5px] font-[620] text-warning sm:inline">
            {t("obra.equipes.pending")}
          </span>
        )}
        {editable ? (
          <select
            value={member.roleInProject}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => onRoleChange(member, event.target.value as ProjectRoleInRequest)}
            aria-label={t("obra.equipes.roleOf", { name: member.user.name })}
            className="h-9 flex-none cursor-pointer rounded-[9px] bg-raised px-2.5 text-[13px] font-[560] text-ink outline-none hairline focus-visible:inset-ring-2 focus-visible:inset-ring-gold"
          >
            {ASSIGNABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
        ) : (
          <RoleChip role={member.roleInProject} className="flex-none" />
        )}
        {editable && (
          <button
            type="button"
            onClick={() => onRemove(member)}
            aria-label={t("obra.equipes.actions.remove", { name: member.user.name })}
            className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[8px] text-meta transition-opacity hover:bg-danger-soft hover:text-danger sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </motion.li>
  )
}
