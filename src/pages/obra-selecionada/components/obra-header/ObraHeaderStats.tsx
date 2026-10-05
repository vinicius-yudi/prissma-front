import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Progress } from "@/shared/components/ui/progress/Progress"
import { Ticker } from "@/shared/components/ui/ticker/Ticker"

import type { ObraHeaderData } from "../../hooks/useObraHeader"
import { paceKey } from "./obraHeaderText"

const pace = tv({
  base: "text-[12.5px] font-semibold",
  variants: {
    tone: {
      late: "text-danger",
      behind: "text-ink-2",
      onTrack: "text-ink-2",
      ahead: "text-success",
    },
  },
})

interface ObraHeaderStatsProps {
  data: ObraHeaderData
}

/**
 * Número do cabeçalho grande: avanço físico com a trena e o ritmo em relação
 * ao esperado para hoje. Prazo e orçamento ficam nos cards da Visão geral.
 */
export function ObraHeaderStats({ data }: ObraHeaderStatsProps) {
  const { t } = useTranslation()
  const progress = data.progress.progress ?? 0

  return (
    <div className="mt-8 max-w-[520px]">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-meta">{t("projects.card.progress")}</p>
        {data.pace && (
          <p className={pace({ tone: data.pace.tone })}>{t(paceKey(data.pace), { count: data.pace.points })}</p>
        )}
      </div>
      <p className="t-kpi mt-1 text-[44px] text-ink">
        {data.progress.progress === null ? "—" : <Ticker value={progress} />}
        <span className="text-[22px] text-meta">%</span>
      </p>
      <Progress value={progress} expected={data.expected} height={12} className="mt-3" label={t("projects.card.progress")} />
      {data.expected !== undefined && (
        <p className="mt-2 text-[12px] text-meta">{t("obra.header.expectedHint", { value: data.expected })}</p>
      )}
    </div>
  )
}
