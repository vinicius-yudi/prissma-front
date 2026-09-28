import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { DayState } from "../types/schedule"

/**
 * Legenda dos três estados da célula.
 *
 * O protótipo chamava o estado do meio de "Outra etapa", mas lá a cor saía de
 * `etapa === 'Instalações'` — variação tonal cravada no código, sem campo por
 * trás. O sinal que o backend realmente calcula é a sobreposição de tarefas no
 * mesmo dia, e é esse que o rótulo nomeia.
 */

const swatch = tv({
  base: "size-2.5 shrink-0 rounded-[3px]",
  variants: {
    state: {
      FREE: "border border-outline bg-surface-container-high",
      ALLOCATED: "bg-gold-grad",
      OVERLAP: "bg-warn",
    },
  },
})

const ORDER = [DayState.ALLOCATED, DayState.OVERLAP, DayState.FREE] as const

const LABEL_KEY: Record<DayState, string> = {
  [DayState.ALLOCATED]: "obra.schedule.legend.allocated",
  [DayState.OVERLAP]: "obra.schedule.legend.overlap",
  [DayState.FREE]: "obra.schedule.legend.free",
}

export function ScheduleLegend() {
  const { t } = useTranslation()

  return (
    <div className="mt-4 flex flex-wrap items-center gap-[18px] text-[11.5px] text-on-surface-variant">
      {ORDER.map((state) => (
        <span key={state} className="flex items-center gap-[7px]">
          <span className={swatch({ state })} />
          {t(LABEL_KEY[state])}
        </span>
      ))}
    </div>
  )
}
