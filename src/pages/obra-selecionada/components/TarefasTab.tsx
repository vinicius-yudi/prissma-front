import { DndContext, useDroppable } from "@dnd-kit/core"
import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { Select } from "@/shared/components/ui/select/Select"

import { ALL_STAGES, COLUMN_STATUSES } from "../constants/kanban"
import { useTarefasKanban } from "../hooks/useTarefasKanban"
import type { TarefaComEtapa, TarefaStatus } from "../types/tarefas"
import { TaskFormModal } from "./TaskFormModal"
import { TaskKanbanCard } from "./TaskKanbanCard"

/**
 * Tarefas em kanban de quatro colunas (Telas §13).
 *
 * Antes era uma lista agrupada por etapa, com filtro e ordenação próprios em
 * cada grupo. O kanban troca a estrutura: a coluna **é** o status, e arrastar
 * é a forma de mudá-lo.
 *
 * Estado, mutations e o handler de drop vivem em `useTarefasKanban`; aqui só
 * há desenho.
 */

const columnDot = tv({
  base: "size-1.5 shrink-0 rounded-full",
  variants: {
    status: {
      TODO: "bg-on-surface-faint",
      IN_PROGRESS: "bg-gold-bright",
      DONE: "bg-ok",
      BLOCKED: "bg-warn",
    },
  },
})

const column = tv({
  base: "flex min-h-[220px] flex-col gap-2.5 rounded-2xl border p-3 transition-colors",
  variants: {
    over: {
      true: "border-gold bg-surface-container-high",
      false: "border-outline-variant bg-surface-container-low",
    },
  },
})

interface KanbanColumnProps {
  status: TarefaStatus
  items: TarefaComEtapa[]
  canMutate: boolean
  onEdit: (item: TarefaComEtapa) => void
  onDelete: (item: TarefaComEtapa) => void
}

function KanbanColumn({ status, items, canMutate, onEdit, onDelete }: KanbanColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={column({ over: isOver })}>
      <div className="flex items-center gap-2 px-1">
        <span className={columnDot({ status })} />
        <span className="text-[12.5px] font-semibold text-on-surface">
          {t(`obra.tarefas.columns.${status}`)}
        </span>
        <Num className="ml-auto text-[11px] font-bold text-on-surface-faint">{items.length}</Num>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-outline p-4 text-center text-[11.5px] text-on-surface-faint">
          {t("obra.tarefas.emptyColumn")}
        </div>
      ) : (
        items.map((item) => (
          <TaskKanbanCard
            key={item.tarefa.id}
            tarefa={item.tarefa}
            stageId={item.stageId}
            canMutate={canMutate}
            onEdit={() => onEdit(item)}
            onDelete={() => onDelete(item)}
          />
        ))
      )}
    </div>
  )
}

interface TarefasTabProps {
  projectId: number
}

export function TarefasTab({ projectId }: TarefasTabProps) {
  const { t } = useTranslation()
  const kanban = useTarefasKanban(projectId)

  const [createForStage, setCreateForStage] = useState<number | null>(null)
  const [editing, setEditing] = useState<TarefaComEtapa | null>(null)

  if (kanban.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMN_STATUSES.map((status) => (
          <div key={status} className="h-56 animate-pulse rounded-2xl bg-surface-container-low" />
        ))}
      </div>
    )
  }

  if (kanban.stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-outline bg-surface-container-low py-20 text-center">
        <p className="text-sm font-semibold text-on-surface">{t("obra.tarefas.noStagesTitle")}</p>
        <p className="max-w-sm text-sm text-on-surface-variant">{t("obra.tarefas.noStagesHint")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-[260px]">
          <Select
            value={kanban.stageFilter}
            onChange={(e) => kanban.setStageFilter(e.currentTarget.value)}
          >
            <option value={ALL_STAGES}>{t("obra.tarefas.allStages")}</option>
            {kanban.stages.map(({ stage }) => (
              <option key={stage.id} value={String(stage.id)}>
                {stage.name}
              </option>
            ))}
          </Select>
        </div>

        <Num className="text-[11.5px] text-on-surface-variant">
          {t("obra.tarefas.count", { count: kanban.visible.length })}
        </Num>

        {kanban.canMutate && kanban.firstStageId !== null && (
          <Button
            variant="primary"
            fullWidth={false}
            className="ml-auto"
            onClick={() =>
              setCreateForStage(
                kanban.stageFilter === ALL_STAGES
                  ? kanban.firstStageId
                  : Number(kanban.stageFilter),
              )
            }
          >
            <Plus size={15} />
            {t("obra.tarefas.newTask")}
          </Button>
        )}
      </div>

      <DndContext sensors={kanban.sensors} onDragEnd={kanban.handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              items={kanban.byStatus(status)}
              canMutate={kanban.canMutate}
              onEdit={setEditing}
              onDelete={kanban.requestDelete}
            />
          ))}
        </div>
      </DndContext>

      <TaskFormModal
        open={createForStage !== null}
        onClose={() => setCreateForStage(null)}
        stageId={createForStage}
        projectId={projectId}
        canMutate={kanban.canMutate}
      />

      <TaskFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        stageId={editing?.stageId ?? null}
        projectId={projectId}
        canMutate={kanban.canMutate}
        tarefaToEdit={editing?.tarefa ?? null}
        onSaved={() => setEditing(null)}
      />

      <Modal
        open={!!kanban.deleting}
        onClose={kanban.cancelDelete}
        title={t("obra.tarefas.deleteTitle")}
        description={t("obra.tarefas.deleteDescription", {
          title: kanban.deleting?.tarefa.title ?? "",
        })}
        icon={<Trash2 size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="flex gap-2 px-6 pb-6">
          <Button variant="outline" onClick={kanban.cancelDelete}>
            {t("obra.tarefas.cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={kanban.isDeleting}
            onClick={kanban.confirmDelete}
          >
            {t("obra.tarefas.confirmDelete")}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
