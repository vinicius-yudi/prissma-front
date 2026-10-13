import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { COLUMN_STATUSES, DONE_PREVIEW, QUICK_ADD_DAYS, TASK_PRIORITY, TASK_STATUS } from "../../constants/kanban"
import type { TarefasKanban } from "../../hooks/useTarefasKanban"
import type { TarefaComEtapa, TarefaStatus } from "../../types/tarefas"
import { recentDone } from "../../utils/taskFilters"
import { quickAddDates } from "../../utils/taskDates"
import { TaskCard } from "./TaskCard"
import { TaskCardBody } from "./TaskCardBody"
import { TaskColumn } from "./TaskColumn"
import { TaskQuickAdd } from "./TaskQuickAdd"

const DROP_ANIMATION = { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }

interface TaskBoardProps {
  kanban: TarefasKanban
  onOpen: (item: TarefaComEtapa) => void
}

/**
 * O quadro: quatro colunas lado a lado (no celular, uma por vez com snap) e o
 * fantasma do card girado 1.5° enquanto arrasta.
 */
export function TaskBoard({ kanban, onOpen }: TaskBoardProps) {
  const { t } = useTranslation()
  const [showAllDone, setShowAllDone] = useState(false)
  const showStage = kanban.filterState.filters.stageId === null
  const target = kanban.targetStage

  function itemsOf(status: TarefaStatus): TarefaComEtapa[] {
    const items = kanban.columns[status]
    return status === TASK_STATUS.DONE ? recentDone(items, showAllDone) : items
  }

  function quickAdd(status: TarefaStatus) {
    return (title: string) => {
      if (!target) return Promise.reject(new Error("no stage"))
      return kanban.actions.createAsync({
        stageId: target.id,
        payload: { title, status, priority: TASK_PRIORITY.MEDIUM, ...quickAddDates(target.plannedStartDate, QUICK_ADD_DAYS) },
      })
    }
  }

  function footerOf(status: TarefaStatus) {
    const hidden = kanban.columns.DONE.length - DONE_PREVIEW
    return (
      <>
        {status === TASK_STATUS.DONE && hidden > 0 && (
          <button
            type="button"
            onClick={() => setShowAllDone((v) => !v)}
            className="mt-2 h-9 cursor-pointer rounded-[10px] text-[12.5px] font-[620] text-gold-hi hover:bg-surface"
          >
            {showAllDone ? t("obra.tarefas.showRecent") : t("obra.tarefas.showMoreDone", { count: hidden })}
          </button>
        )}
        {kanban.canMutate && target && (
          <TaskQuickAdd stageName={target.name} isSaving={kanban.actions.isCreating} onAdd={quickAdd(status)} />
        )}
      </>
    )
  }

  return (
    <DndContext
      sensors={kanban.sensors}
      collisionDetection={closestCorners}
      onDragStart={kanban.handleDragStart}
      onDragEnd={kanban.handleDragEnd}
      onDragCancel={kanban.handleDragCancel}
    >
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        {COLUMN_STATUSES.map((status) => (
          <TaskColumn key={status} status={status} count={kanban.columns[status].length} footer={footerOf(status)}>
            {itemsOf(status).map((item) => (
              <TaskCard key={item.tarefa.id} item={item} showStage={showStage} canMutate={kanban.canMutate} onOpen={onOpen} />
            ))}
          </TaskColumn>
        ))}
      </div>
      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {kanban.active && (
          <div className="w-[300px] cursor-grabbing">
            <TaskCardBody tarefa={kanban.active.tarefa} stageName={showStage ? kanban.active.stageName : undefined} dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
