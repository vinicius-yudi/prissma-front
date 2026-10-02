import { useDroppable } from "@dnd-kit/core"
import { motion } from "motion/react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { TASK_STATUS } from "../../constants/kanban"
import { columnDroppableId } from "../../hooks/useTarefasKanban"
import type { TarefaStatus } from "../../types/tarefas"

const column = tv({
  base: "flex w-[84vw] max-w-[340px] shrink-0 snap-start flex-col rounded-[18px] bg-raised/70 p-2 transition-shadow sm:w-auto sm:max-w-none",
  variants: { over: { true: "inset-ring-2 inset-ring-gold" } },
})

const header = tv({
  base: "mb-2 flex h-10 items-center gap-2 rounded-[11px] px-2.5",
  variants: { blocked: { true: "hazard" } },
})

const dot = tv({
  base: "size-2 rounded-full",
  variants: {
    status: {
      TODO: "bg-border-strong",
      IN_PROGRESS: "bg-gold",
      BLOCKED: "bg-danger",
      DONE: "bg-success",
    },
  },
})

interface TaskColumnProps {
  status: TarefaStatus
  count: number
  /** Cards, "ver mais" e adição rápida — montados por quem tem os dados. */
  children: ReactNode
  footer?: ReactNode
}

/**
 * Coluna do kanban: o status é a coluna, soltar aqui muda o status. A
 * contagem pulsa em ouro quando muda, para o olho achar onde o card caiu.
 */
export function TaskColumn({ status, count, children, footer }: TaskColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: columnDroppableId(status) })
  const label = t(`obra.tarefas.columns.${status}`)

  return (
    <section aria-label={label} className={column({ over: isOver })}>
      <header className={header({ blocked: status === TASK_STATUS.BLOCKED })}>
        <span className={dot({ status })} />
        <h3 className="t-section text-[14px] text-ink">{label}</h3>
        <motion.span
          key={count}
          initial={{ scale: 1.5, color: "var(--gold-hi)" }}
          animate={{ scale: 1, color: "var(--ink-3)" }}
          className="t-num text-[12.5px]"
        >
          {count}
        </motion.span>
      </header>
      <div ref={setNodeRef} className="flex min-h-[120px] flex-1 flex-col">
        {count === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-[13px] border border-dashed border-border-strong py-8 text-[12.5px] text-meta">
            {t("obra.tarefas.emptyColumn")}
          </div>
        ) : (
          <ul className="flex flex-col gap-2 p-0">{children}</ul>
        )}
        {footer}
      </div>
    </section>
  )
}
