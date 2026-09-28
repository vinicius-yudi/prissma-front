import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Num } from "@/shared/components/ui/num/Num"

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

const PERIOD_ARROW =
  "flex size-8 cursor-pointer items-center justify-center rounded-lg text-on-surface-faint transition-colors hover:bg-surface-container-high hover:text-on-surface"

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
        <div className="flex w-fit gap-0.5 rounded-full border border-outline-variant bg-surface-container-high p-1">
          <Button
            variant={isWeek ? "menuSelected" : "menu"}
            size="sm"
            fullWidth={false}
            aria-pressed={isWeek}
            onClick={() => onViewChange(ScheduleView.WEEK)}
            className="rounded-full px-4"
          >
            {t("obra.schedule.views.week")}
          </Button>
          <Button
            variant={isWeek ? "menu" : "menuSelected"}
            size="sm"
            fullWidth={false}
            aria-pressed={!isWeek}
            onClick={() => onViewChange(ScheduleView.MONTH)}
            className="rounded-full px-4"
          >
            {t("obra.schedule.views.month")}
          </Button>
        </div>

        {isWeek && (
          <p className="font-mono text-[10.5px] tracking-[0.05em] text-on-surface-faint">
            {t(`obra.schedule.period.${range.key}`, range.values)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={onPrevious}
          aria-label={t("obra.schedule.a11y.previousPeriod")}
          className={PERIOD_ARROW}
        >
          <ChevronLeft size={16} />
        </button>
        <Num className="font-semibold text-on-surface">
          {formatMonthLabel(schedule.startDate, i18n.language)}
        </Num>
        <button
          type="button"
          onClick={onNext}
          aria-label={t("obra.schedule.a11y.nextPeriod")}
          className={PERIOD_ARROW}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
