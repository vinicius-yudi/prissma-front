import { useTranslation } from "react-i18next"

/** Legenda do cronograma: tracejado = previsto, listras = além do prazo. */
export function GanttLegend() {
  const { t } = useTranslation()

  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-meta">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-5 rounded-[3px] bg-success/85" />
        {t("obra.gantt.legend.done")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-5 overflow-hidden rounded-[3px] bg-gold-soft inset-ring inset-ring-gold">
          <span className="block h-full w-1/2 bg-gold" />
        </span>
        {t("obra.gantt.legend.inProgress")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-5 rounded-[3px] border border-dashed border-border-strong" />
        {t("obra.gantt.legend.planned")}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="hazard h-2.5 w-5 rounded-[3px]" />
        {t("obra.gantt.legend.late")}
      </span>
    </div>
  )
}
