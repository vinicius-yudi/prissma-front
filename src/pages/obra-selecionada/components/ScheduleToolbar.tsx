import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { IconButton } from "@/shared/components/ui/icon-button/IconButton"
import { Segmented } from "@/shared/components/ui/segmented/Segmented"

import { ScheduleView, type TeamSchedule } from "../types/schedule"
import { formatMonthLabel, weekRangeLabel } from "../utils/scheduleFormat"

/**
 * Segmentado Semana/Mês à esquerda, navegação de período à direita.
 *
 * A linha "Semana de 10 a 16 ago 2026" é o subtítulo que o protótipo põe sob o
 * H1 — mas o H1 desta tela é o do <ObraLayout>, e a linha de cota de lá já
 * ocupou a única permitida por tela (Style Guide v2 §4). Ela desce para cá,
 * como legenda do período, e só existe na semana: no mês repetiria o rótulo da
 * navegação ao lado.
 */

interface ScheduleToolbarProps {
  schedule: TeamSchedule
  onViewChange: (view: ScheduleView) => void
  onPrevious: () => void
  onNext: () => void
}

export function ScheduleToolbar({
  schedule,
  onViewChange,
  onPrevious,
  onNext,
}: ScheduleToolbarProps) {
  const { t, i18n } = useTranslation()

  const isWeek = schedule.view === ScheduleView.WEEK
  const range = weekRangeLabel(schedule.startDate, schedule.endDate, i18n.language)

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <Segmented
          id="schedule-view"
          size="sm"
          label={t("obra.schedule.viewLabel")}
          value={schedule.view}
          onChange={onViewChange}
          options={[
            { value: ScheduleView.WEEK, label: t("obra.schedule.views.week") },
            { value: ScheduleView.MONTH, label: t("obra.schedule.views.month") },
          ]}
        />

        {isWeek && (
          <p className="t-num text-[12.5px] text-meta">
            {t(`obra.schedule.period.${range.key}`, range.values)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <IconButton label={t("obra.schedule.a11y.previousPeriod")} onClick={onPrevious} className="size-9">
          <ChevronLeft size={16} />
        </IconButton>
        <span className="t-data min-w-28 text-center text-[14px] font-[620] text-ink first-letter:uppercase">
          {formatMonthLabel(schedule.startDate, i18n.language)}
        </span>
        <IconButton label={t("obra.schedule.a11y.nextPeriod")} onClick={onNext} className="size-9">
          <ChevronRight size={16} />
        </IconButton>
      </div>
    </div>
  )
}
