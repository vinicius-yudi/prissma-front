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
  base: "t-num px-3.5 py-3 text-center text-[12px] font-[560] first-letter:uppercase",
  variants: {
    weekend: {
      true: "text-meta",
      false: "text-ink-2",
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
    <div className="overflow-x-auto rounded-md hairline">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="sticky left-0 z-10 w-[190px] min-w-[190px] bg-surface px-3.5 py-3 text-left text-[12px] font-[560] text-meta"
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

        <tbody className="divide-y divide-border">
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
