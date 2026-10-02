import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"

import { COLUMN_STATUSES } from "../../constants/kanban"
import type { TarefaStatus } from "../../types/tarefas"

const option = tv({
  base: "relative flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-[600] disabled:cursor-default",
  variants: { selected: { true: "text-ink", false: "text-meta hairline hover:text-ink" } },
})

const highlight = tv({
  base: "absolute inset-0 rounded-[10px]",
  variants: {
    status: {
      TODO: "bg-raised inset-ring-[1.5px] inset-ring-border-strong",
      IN_PROGRESS: "bg-gold-soft inset-ring-[1.5px] inset-ring-gold",
      BLOCKED: "bg-danger-soft inset-ring-[1.5px] inset-ring-danger",
      DONE: "bg-success-soft inset-ring-[1.5px] inset-ring-success",
    },
  },
})

const dot = tv({
  base: "relative size-1.5 rounded-full",
  variants: {
    status: { TODO: "bg-border-strong", IN_PROGRESS: "bg-gold", BLOCKED: "bg-danger", DONE: "bg-success" },
  },
})

interface TaskStatusPickerProps {
  value: TarefaStatus
  disabled: boolean
  onChange: (status: TarefaStatus) => void
}

/** Os quatro status como botões — alternativa ao arraste no kanban. */
export function TaskStatusPicker({ value, disabled, onChange }: TaskStatusPickerProps) {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={t("obra.tarefas.form.status")} className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {COLUMN_STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          disabled={disabled}
          aria-pressed={value === status}
          onClick={() => onChange(status)}
          className={option({ selected: value === status })}
        >
          {value === status && <motion.span layoutId="task-status" className={highlight({ status })} transition={SPRING} />}
          <span className={dot({ status })} />
          <span className="relative">{t(`obra.tarefas.columns.${status}`)}</span>
        </button>
      ))}
    </div>
  )
}
