import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"

import { DayState, type DaySchedule } from "../types/schedule"
import { dayStateOf, formatFullDate, formatHours, isWeekend } from "../utils/scheduleFormat"

/**
 * Célula de um dia na grade.
 *
 * O bloco de 34px com as horas centralizadas é do protótipo. Fim de semana
 * entra atenuado: o período do backend vai de segunda a domingo e as horas de
 * sábado contam no total da linha, então esconder a coluna faria a soma não
 * bater com o que está à vista.
 */

const block = tv({
  base: "flex h-[34px] w-full items-center justify-center rounded-lg transition-colors",
  variants: {
    state: {
      FREE: "border border-dashed border-outline-variant bg-transparent",
      ALLOCATED: "bg-gold-grad text-on-primary",
      OVERLAP: "bg-warn-bg text-warn",
    },
    interactive: {
      true: "cursor-pointer",
      false: "",
    },
  },
})

const cell = tv({
  base: "px-1.5 py-2.5 align-middle",
  variants: {
    weekend: {
      true: "opacity-60",
      false: "",
    },
  },
})

const trigger = tv({
  base: "block w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
})

interface ScheduleDayCellProps {
  day: DaySchedule
  memberName: string
  canMutate: boolean
  onSelect: (day: DaySchedule) => void
}

export function ScheduleDayCell({ day, memberName, canMutate, onSelect }: ScheduleDayCellProps) {
  const { t, i18n } = useTranslation()

  const state = dayStateOf(day)
  const hours = formatHours(day.allocatedHours, i18n.language)
  const values = {
    name: memberName,
    date: formatFullDate(day.date, i18n.language),
    hours,
    tasks: String(day.tasks.length),
  }

  const describe: Record<DayState, string> = {
    [DayState.FREE]: t("obra.schedule.a11y.cellFree", values),
    [DayState.ALLOCATED]: t("obra.schedule.a11y.cellAllocated", values),
    [DayState.OVERLAP]: t("obra.schedule.a11y.cellOverlap", values),
  }
  const label = describe[state]

  // O texto das horas já diferencia alocado de livre; a cor não é o único
  // sinal. A sobreposição ganha a lista de tarefas no tooltip, que é a
  // informação que o rótulo curto não cabe.
  const tooltip =
    state === DayState.OVERLAP ? `${label} — ${day.tasks.map((task) => task.title).join(" · ")}` : label

  const content = (
    <div className={block({ state, interactive: canMutate })}>
      {day.allocated && <Num className="text-[10.5px] font-semibold">{hours}</Num>}
    </div>
  )

  return (
    <td className={cell({ weekend: isWeekend(day.date) })}>
      {canMutate ? (
        <button
          type="button"
          aria-label={label}
          title={tooltip}
          onClick={() => onSelect(day)}
          className={trigger()}
        >
          {content}
        </button>
      ) : (
        <div aria-label={label} title={tooltip} role="img">
          {content}
        </div>
      )}
    </td>
  )
}
