import { useDraggable } from "@dnd-kit/core"
import { Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"
import { formatDate } from "@/shared/utils/formatters"
import { deriveStatus } from "@/shared/utils/status"

import type { Tarefa, TarefaPriority } from "../types/tarefas"

/**
 * Card de tarefa do kanban.
 *
 * Atraso ganha borda e filete de perigo mais o ⚠ — status nunca depende só de
 * cor (Acessibilidade §6). A prioridade tem paleta própria e independente do
 * status: Alta perigo · Média alerta · Baixa neutra (Telas §13).
 */

const priorityPill = tv({
  base: "inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.06em]",
  variants: {
    priority: {
      HIGH: "bg-danger-bg text-danger",
      MEDIUM: "bg-warn-bg text-warn",
      LOW: "bg-tint text-on-surface-faint",
    },
  },
})

const card = tv({
  base: "group relative rounded-xl border bg-surface-container-low p-3 transition-colors",
  variants: {
    late: {
      true: "border-danger/50 shadow-[inset_3px_0_0_var(--color-danger-solid)]",
      false: "border-outline-variant hover:border-outline",
    },
    dragging: {
      true: "opacity-40",
      false: "",
    },
  },
})

interface TaskKanbanCardProps {
  tarefa: Tarefa
  stageId: number
  canMutate: boolean
  onEdit: () => void
  onDelete: () => void
}

export function TaskKanbanCard({
  tarefa,
  stageId,
  canMutate,
  onEdit,
  onDelete,
}: TaskKanbanCardProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${tarefa.id}`,
    data: { tarefa, stageId },
    disabled: !canMutate,
  })

  const { state, daysLate } = deriveStatus({
    status: tarefa.status,
    plannedEndDate: tarefa.plannedEndDate,
  })
  const isLate = state === "late"

  const assignee = tarefa.assigneeName?.trim()
  const initials = assignee ? assignee.slice(0, 2).toUpperCase() : "—"

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined}
      className={`${card({ late: isLate, dragging: isDragging })} ${canMutate ? "cursor-grab active:cursor-grabbing" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-on-surface">
          {isLate && <span aria-hidden="true">⚠ </span>}
          {tarefa.title}
        </p>

        {canMutate && (
          <div
            data-no-card-click
            className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onEdit}
              aria-label={t("obra.tarefas.actions.edit")}
              className="cursor-pointer rounded-lg p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onDelete}
              aria-label={t("obra.tarefas.actions.delete")}
              className="cursor-pointer rounded-lg p-1 text-danger/80 transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <span className={priorityPill({ priority: tarefa.priority as TarefaPriority })}>
          {t(`obra.tarefas.priority.${tarefa.priority}`)}
        </span>

        {tarefa.plannedEndDate && (
          <Num className={`text-[11px] ${isLate ? "text-danger" : "text-on-surface-variant"}`}>
            {formatDate(tarefa.plannedEndDate)}
          </Num>
        )}

        <span
          title={assignee ?? t("obra.tarefas.unassigned")}
          className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-container-high text-[9.5px] font-bold text-on-surface-variant"
        >
          {initials}
        </span>
      </div>

      {isLate && (
        <p className="mt-2 text-[10.5px] font-semibold text-danger">
          {t("obra.tarefas.lateBy", { count: daysLate })}
        </p>
      )}
    </div>
  )
}
