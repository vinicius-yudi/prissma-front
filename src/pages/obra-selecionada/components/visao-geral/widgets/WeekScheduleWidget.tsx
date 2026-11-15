import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { scheduleKey } from "../../../hooks/useSchedule"
import { getSchedule } from "../../../services/schedule.service"
import { DayState, ScheduleView } from "../../../types/schedule"
import { dayStateOf, formatHours, formatWeekdayShort } from "../../../utils/scheduleFormat"
import { SectionCard } from "../SectionCard"
import { WidgetSkeleton } from "./WidgetSkeleton"

const MAX_MEMBERS = 6

const cell = tv({
  base: "t-num rounded-sm px-1 py-1.5 text-center text-[12px]",
  variants: {
    state: {
      [DayState.FREE]: "text-meta",
      [DayState.ALLOCATED]: "bg-gold-soft font-[600] text-ink",
      [DayState.OVERLAP]: "bg-danger-soft font-[600] text-danger",
    },
  },
})

/**
 * Versão compacta do Schedule: integrante × dia da semana atual, só as horas.
 * Mesma chave da aba Schedule na semana corrente (`date` nulo), então o cache
 * é compartilhado.
 */
export function WeekScheduleWidget({ projectId }: { projectId: number }) {
  const { t, i18n } = useTranslation()
  const query = useQuery({
    queryKey: scheduleKey(projectId, ScheduleView.WEEK, null),
    queryFn: () => getSchedule(projectId, { view: ScheduleView.WEEK }),
  })
  const schedule = query.data
  const members = (schedule?.members ?? []).slice(0, MAX_MEMBERS)

  return (
    <SectionCard
      title={t("obra.visaoGeral.widgets.week-schedule.title")}
      action={{ to: `/obras/${projectId}/schedule`, label: t("obra.visaoGeral.widgets.week-schedule.action") }}
    >
      {query.isLoading ? (
        <WidgetSkeleton />
      ) : query.isError || !schedule ? (
        <p className="text-[14px] text-danger">{t("obra.visaoGeral.widgets.loadError")}</p>
      ) : members.length === 0 ? (
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.widgets.week-schedule.empty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sr-only">{t("obra.visaoGeral.widgets.week-schedule.member")}</th>
                {schedule.days.map((day) => (
                  <th key={day} scope="col" className="t-num text-[11.5px] font-[560] text-meta">
                    {formatWeekdayShort(day, i18n.language)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.userId}>
                  <th scope="row" className="max-w-[140px] truncate pr-2 text-left text-[13px] font-[560] text-ink">
                    {member.userName}
                  </th>
                  {member.days.map((day) => {
                    const state = dayStateOf(day)
                    return (
                      <td key={day.date} className={cell({ state })}>
                        {state === DayState.FREE ? "—" : formatHours(day.allocatedHours, i18n.language)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}
