import { AnimatePresence } from "motion/react"
import { useTranslation } from "react-i18next"

import type { DiarioEntry } from "../../types/diario"
import { relativeDay, type DiaryDay } from "../../utils/diarioGroups"
import { DiaryEntryCard } from "./DiaryEntryCard"

interface DiaryDayGroupProps {
  day: DiaryDay
  canDelete: boolean
  onOpen: (entry: DiarioEntry) => void
  onDelete: (entry: DiarioEntry) => void
}

/** Um dia do diário: "Hoje", "Ontem" ou a data por extenso, e os registros dele. */
export function DiaryDayGroup({ day, canDelete, onOpen, onDelete }: DiaryDayGroupProps) {
  const { t, i18n } = useTranslation()
  const relative = relativeDay(day.date)
  const label = relative
    ? t(`obra.diario.days.${relative}`)
    : day.date.toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" })

  return (
    <section aria-label={label}>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="t-section text-[15px] text-ink first-letter:uppercase">{label}</h3>
        <span className="h-px flex-1 bg-border" />
        <span className="t-num text-[12px] text-meta">{t("obra.diario.count", { count: day.entries.length })}</span>
      </div>
      <ol className="relative space-y-3 p-0 before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-px before:bg-border">
        <AnimatePresence initial={false}>
          {day.entries.map((entry) => (
            <DiaryEntryCard key={entry.id} entry={entry} canDelete={canDelete} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}
