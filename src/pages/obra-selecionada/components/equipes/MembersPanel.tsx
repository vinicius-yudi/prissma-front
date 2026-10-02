import { UserPlus } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

import { ROLE_ORDER } from "../../constants/equipes"
import type { ConstructionProjectMember, ProjectRoleInRequest, RoleInProject } from "../../types/equipes"
import { MemberRow } from "./MemberRow"

interface MembersPanelProps {
  members: ConstructionProjectMember[]
  meId: number | null
  /** Papel em foco na matriz — os demais esmaecem. */
  focusRole: RoleInProject | null
  canManage: boolean
  onInvite: () => void
  onRoleChange: (member: ConstructionProjectMember, role: ProjectRoleInRequest) => void
  onRemove: (member: ConstructionProjectMember) => void
}

/** "Pessoas": quem está na obra, com o papel de cada um. */
export function MembersPanel({ members, meId, focusRole, canManage, onInvite, onRoleChange, onRemove }: MembersPanelProps) {
  const { t } = useTranslation()
  const sorted = [...members].sort(
    (a, b) => ROLE_ORDER[a.roleInProject] - ROLE_ORDER[b.roleInProject] || a.user.name.localeCompare(b.user.name),
  )

  return (
    <section aria-label={t("obra.equipes.people")} className="overflow-hidden rounded-lg bg-surface hairline">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
        <div className="flex items-baseline gap-2">
          <h2 className="t-section text-ink">{t("obra.equipes.people")}</h2>
          <span className="t-data text-meta">{members.length}</span>
        </div>
        {canManage && (
          // No celular quem convida é a ação flutuante.
          <Button size="sm" fullWidth={false} onClick={onInvite} className="hidden lg:inline-flex">
            <UserPlus size={15} />
            {t("obra.equipes.actions.addMember")}
          </Button>
        )}
      </div>
      {sorted.length === 0 ? (
        <div className="px-5 pb-5">
          <EmptyState title={t("obra.equipes.empty")} />
        </div>
      ) : (
        <ul className="divide-y divide-border p-0">
          <AnimatePresence initial={false}>
            {sorted.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isMe={member.user.id === meId}
                dimmed={focusRole !== null && focusRole !== member.roleInProject}
                canManage={canManage}
                onRoleChange={onRoleChange}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
