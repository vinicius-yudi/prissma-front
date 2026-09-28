import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"

import type { MemberSchedule } from "../types/schedule"

/**
 * Coluna do integrante — avatar de iniciais, nome e responsabilidade na obra.
 *
 * Fica fixa na horizontal (`sticky`) porque a grade rola de lado no mês e no
 * celular: sem isso, a partir da terceira coluna ninguém sabe de quem é a linha.
 */

const header = tv({
  base: "sticky left-0 z-10 w-[190px] min-w-[190px] bg-surface px-3.5 py-3 text-left",
})

const identity = tv({
  base: "flex w-full items-center gap-2.5 text-left",
  variants: {
    interactive: {
      true: "cursor-pointer rounded-[8px] outline-none hover:text-gold-hi focus-visible:ring-2 focus-visible:ring-gold",
      false: "",
    },
  },
})

interface ScheduleMemberCellProps {
  member: MemberSchedule
  canMutate: boolean
  onEditResponsibility: (member: MemberSchedule) => void
}

export function ScheduleMemberCell({
  member,
  canMutate,
  onEditResponsibility,
}: ScheduleMemberCellProps) {
  const { t } = useTranslation()

  const content = (
    <>
      <Avatar name={member.userName} size={32} className="flex-none" />
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-[600] text-ink">
          {member.userName}
        </span>
        <span className="block truncate text-[12px] text-meta">
          {member.userResponsibility ?? t("obra.schedule.noResponsibility")}
        </span>
      </span>
    </>
  )

  return (
    <th scope="row" className={header()}>
      {canMutate ? (
        <button
          type="button"
          onClick={() => onEditResponsibility(member)}
          aria-label={t("obra.schedule.a11y.editResponsibility", { name: member.userName })}
          className={identity({ interactive: true })}
        >
          {content}
        </button>
      ) : (
        <span className={identity({ interactive: false })}>{content}</span>
      )}
    </th>
  )
}
