import { useTranslation } from "react-i18next"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"

import { useObraMembers } from "../../hooks/useObraMembers"
import { SectionCard } from "./SectionCard"

const MAX = 6

/** Quem está na obra: avatar, nome e papel; o responsável em ouro. */
export function OverviewTeam({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const { list, count } = useObraMembers(projectId)

  return (
    <SectionCard
      title={t("obra.visaoGeral.allocatedTeams")}
      meta={count}
      action={{ to: `/obras/${projectId}/equipes`, label: t("obra.visaoGeral.seeTeams") }}
    >
      {count === 0 ? (
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.noTeam")}</p>
      ) : (
        <ul className="space-y-3">
          {list.slice(0, MAX).map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <Avatar name={member.user.name} size={34} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-[580] text-ink">{member.user.name}</span>
              <RoleChip role={member.roleInProject} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
