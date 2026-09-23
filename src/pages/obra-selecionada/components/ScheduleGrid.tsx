import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { ScheduleView, type DaySchedule, type MemberSchedule, type TeamSchedule } from "../types/schedule"
import { formatDayOfMonth, formatWeekdayShort, isWeekend } from "../utils/scheduleFormat"
import { ScheduleDayCell } from "./ScheduleDayCell"
import { ScheduleMemberCell } from "./ScheduleMemberCell"

/**
 * A grade é uma `<table>` de verdade, com `th scope`: linha × coluna só faz
 * sentido em leitor de tela se a associação estiver no HTML.
 *
 * O scroll horizontal com a coluna do integrante fixa é o que faz a mesma
 * grade servir para a semana (7 colunas), para o mês (28–31) e para o celular,
 * sem um segundo layout.
 */

const dayHeader = tv({
  base: "px-3.5 py-3 text-center text-[11.5px] font-normal",
  variants: {
    weekend: {
      true: "text-on-surface-faint",
      false: "text-on-surface-variant",
    },
  },
})

interface ScheduleGridProps {
  schedule: TeamSchedule
  canMutate: boolean
  onSelectDay: (member: MemberSchedule, day: DaySchedule) => void
  onEditResponsibility: (member: MemberSchedule) => void
}

export function ScheduleGrid({
  schedule,
  canMutate,
  onSelectDay,
  onEditResponsibility,
}: ScheduleGridProps) {
  const { t, i18n } = useTranslation()

  const isWeek = schedule.view === ScheduleView.WEEK
  const columnLabel = (iso: string) =>
    isWeek ? formatWeekdayShort(iso, i18n.language) : formatDayOfMonth(iso)

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-outline-variant">
            <th
              scope="col"
              className="sticky left-0 z-10 w-[170px] min-w-[170px] bg-surface-container-low px-3.5 py-3 text-left text-[11px] font-normal uppercase tracking-[0.08em] text-on-surface-faint"
            >
              {t("obra.schedule.columns.member")}
            </th>
            {schedule.days.map((day) => (
              <th key={day} scope="col" className={dayHeader({ weekend: isWeekend(day) })}>
                {columnLabel(day)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-outline-variant">
          {schedule.members.map((member) => (
            <tr key={member.userId}>
              <ScheduleMemberCell
                member={member}
                canMutate={canMutate}
                onEditResponsibility={onEditResponsibility}
              />
              {member.days.map((day) => (
                <ScheduleDayCell
                  key={day.date}
                  day={day}
                  memberName={member.userName}
                  canMutate={canMutate}
                  onSelect={(selected) => onSelectDay(member, selected)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
