import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { MemberSchedule } from "../types/schedule"
import { initialsOf } from "../utils/scheduleFormat"

/**
 * Coluna do integrante — avatar de iniciais, nome e responsabilidade na obra.
 *
 * Fica fixa na horizontal (`sticky`) porque a grade rola de lado no mês e no
 * celular: sem isso, a partir da terceira coluna ninguém sabe de quem é a linha.
 */

const header = tv({
  base: "sticky left-0 z-10 w-[170px] min-w-[170px] bg-surface-container-low px-3.5 py-3 text-left",
})

const avatar = tv({
  base: "flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-grad text-[11px] font-bold text-on-primary",
})

const identity = tv({
  base: "flex w-full items-center gap-2.5 text-left",
  variants: {
    interactive: {
      true: "cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
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
      <span className={avatar()} aria-hidden="true">
        {initialsOf(member.userName)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-on-surface">
          {member.userName}
        </span>
        <span className="block truncate text-[10.5px] text-on-surface-faint">
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
