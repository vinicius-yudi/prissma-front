import { useDraggable, useDroppable } from "@dnd-kit/core"
import { motion } from "motion/react"
import type { KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"

import type { TarefaComEtapa } from "../../types/tarefas"
import { TaskCardBody } from "./TaskCardBody"

const handle = tv({
  base: "rounded-[13px] outline-none focus-visible:ring-2 focus-visible:ring-gold",
  variants: {
    draggable: { true: "cursor-grab touch-manipulation active:cursor-grabbing", false: "cursor-pointer" },
  },
})

const item = tv({
  base: "group list-none",
  variants: { dragging: { true: "opacity-30" } },
})

interface TaskCardProps {
  item: TarefaComEtapa
  showStage: boolean
  canMutate: boolean
  onOpen: (item: TarefaComEtapa) => void
}

/**
 * Card arrastável. Também é alvo de drop: soltar sobre um card vale o status
 * da coluna dele. Clique ou Enter abre a tarefa; Espaço pega para arrastar.
 */
export function TaskCard({ item: task, showStage, canMutate, onOpen }: TaskCardProps) {
  const { t } = useTranslation()
  const { tarefa } = task
  const drag = useDraggable({ id: tarefa.id, disabled: !canMutate })
  const drop = useDroppable({ id: tarefa.id })

  function setRef(node: HTMLElement | null) {
    drag.setNodeRef(node)
    drop.setNodeRef(node)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") onOpen(task)
    drag.listeners?.onKeyDown?.(event)
  }

  return (
    <li ref={setRef} className={item({ dragging: drag.isDragging })}>
      <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING}>
        <div
          {...drag.attributes}
          {...drag.listeners}
          role="button"
          tabIndex={0}
          aria-label={t("obra.tarefas.cardLabel", { title: tarefa.title, status: t(`obra.tarefas.columns.${tarefa.status}`) })}
          aria-roledescription={canMutate ? t("obra.tarefas.draggable") : undefined}
          onClick={() => onOpen(task)}
          onKeyDown={handleKeyDown}
          className={handle({ draggable: canMutate })}
        >
          <TaskCardBody tarefa={tarefa} stageName={showStage ? task.stageName : undefined} />
        </div>
      </motion.div>
    </li>
  )
}
