import { AlertTriangle, CalendarDays, Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { formatDate } from "@/shared/utils/formatters"
import { daysLate, startOfLocalDay, startOfToday } from "@/shared/utils/status"

import { TASK_STATUS } from "../../constants/kanban"
import type { Tarefa } from "../../types/tarefas"
import { PriorityBars } from "./PriorityBars"

type DueTone = "late" | "done" | "soon" | "normal"

const body = tv({
  base: "relative overflow-hidden rounded-[13px] bg-surface p-3.5 hairline transition-shadow",
  variants: {
    dragging: { true: "rotate-[1.5deg] shadow-lift", false: "group-hover:shadow-soft" },
    done: { true: "opacity-75" },
  },
})

const title = tv({
  base: "min-w-0 flex-1 text-[14px] leading-snug font-[560] text-ink",
  variants: { done: { true: "text-ink-2 line-through decoration-ink-3/60" } },
})

const due = tv({
  base: "t-num inline-flex h-6 items-center gap-1 rounded-pill px-2 text-[11.5px] font-[600]",
  variants: {
    tone: {
      late: "bg-danger-soft text-danger",
      done: "text-ink-3",
      soon: "bg-warning-soft text-warning",
      normal: "bg-raised text-ink-2",
    },
  },
})

const DUE_ICON = { late: AlertTriangle, done: Check, soon: CalendarDays, normal: CalendarDays }

/** Dias até o prazo (negativo = passou). */
function daysUntil(date: string): number {
  const end = startOfLocalDay(date)
  return end ? Math.round((end.getTime() - startOfToday().getTime()) / 86_400_000) : Infinity
}

function dueTone(tarefa: Tarefa): DueTone {
  if (tarefa.status === TASK_STATUS.DONE) return "done"
  if (daysLate(tarefa.plannedEndDate) > 0) return "late"
  return daysUntil(tarefa.plannedEndDate) <= 2 ? "soon" : "normal"
}

interface TaskCardBodyProps {
  tarefa: Tarefa
  /** Mostrado quando a vista cobre todas as etapas. */
  stageName?: string
  dragging?: boolean
}

/** O desenho do card — o mesmo na coluna e no fantasma do arraste. */
export function TaskCardBody({ tarefa, stageName, dragging = false }: TaskCardBodyProps) {
  const { t } = useTranslation()
  const tone = dueTone(tarefa)
  const Icon = DUE_ICON[tone]
  const done = tarefa.status === TASK_STATUS.DONE
  const dueLabel = {
    done: t("obra.tarefas.columns.DONE"),
    late: t("obra.tarefas.lateShort", { count: daysLate(tarefa.plannedEndDate) }),
    soon: daysUntil(tarefa.plannedEndDate) === 0 ? t("obra.tarefas.dueToday") : formatDate(tarefa.plannedEndDate),
    normal: tarefa.plannedEndDate ? formatDate(tarefa.plannedEndDate) : "—",
  }[tone]

  return (
    <div className={body({ dragging, done })}>
      {tarefa.status === TASK_STATUS.BLOCKED && <span aria-hidden="true" className="hazard absolute inset-y-0 left-0 w-1.5" />}
      <div className="flex items-start gap-2">
        <p className={title({ done })}>{tarefa.title}</p>
        <PriorityBars priority={tarefa.priority} />
      </div>
      {stageName && <p className="mt-1.5 truncate text-[12px] text-meta">{stageName}</p>}
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={due({ tone })}>
          <Icon size={11} aria-hidden="true" />
          {dueLabel}
        </span>
        <Avatar name={tarefa.assigneeName} size={24} />
      </div>
    </div>
  )
}
