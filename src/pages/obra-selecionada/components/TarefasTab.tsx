import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { Select } from "@/shared/components/ui/select/Select"

import { useProjectPermissions } from "../hooks/useProjectPermissions"
import { useTarefasByProject } from "../hooks/useTarefasByProject"
import { ProjectPermission } from "../services/projectPermissions.service"
import { deleteTarefa, updateTarefa } from "../services/tarefas.service"
import type { Tarefa, TarefaStatus } from "../types/tarefas"
import { TaskFormModal } from "./TaskFormModal"
import { TaskKanbanCard } from "./TaskKanbanCard"

/**
 * Tarefas em kanban de quatro colunas (Telas §13).
 *
 * Antes era uma lista agrupada por etapa, com filtro e ordenação próprios em
 * cada grupo. O kanban troca a estrutura: a coluna **é** o status, e arrastar
 * é a forma de mudá-lo — o `PATCH` sai do próprio gesto.
 *
 * As tarefas pendem de etapas no backend (`/stages/{id}/tasks`), então cada
 * card carrega o `stageId` de origem para saber a que coleção pertence.
 */

const COLUMNS: { status: TarefaStatus; dot: string }[] = [
  { status: "TODO", dot: "bg-on-surface-faint" },
  { status: "IN_PROGRESS", dot: "bg-gold-bright" },
  { status: "DONE", dot: "bg-ok" },
  { status: "BLOCKED", dot: "bg-warn" },
]

const column = tv({
  base: "flex min-h-[220px] flex-col gap-2.5 rounded-2xl border p-3 transition-colors",
  variants: {
    over: {
      true: "border-gold bg-surface-container-high",
      false: "border-outline-variant bg-surface-container-low",
    },
  },
})

interface TarefaComEtapa {
  tarefa: Tarefa
  stageId: number
  stageName: string
}

interface KanbanColumnProps {
  status: TarefaStatus
  dot: string
  items: TarefaComEtapa[]
  canMutate: boolean
  onEdit: (item: TarefaComEtapa) => void
  onDelete: (item: TarefaComEtapa) => void
}

function KanbanColumn({ status, dot, items, canMutate, onEdit, onDelete }: KanbanColumnProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={column({ over: isOver })}>
      <div className="flex items-center gap-2 px-1">
        <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
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
  const queryClient = useQueryClient()
  const { stages, isLoading } = useTarefasByProject(projectId)
  const { can, isAdmin } = useProjectPermissions(projectId)
  const canMutate = isAdmin || can(ProjectPermission.MANAGE_TASKS)

  const [stageFilter, setStageFilter] = useState<string>("ALL")
  const [createForStage, setCreateForStage] = useState<number | null>(null)
  const [editing, setEditing] = useState<TarefaComEtapa | null>(null)
  const [deleting, setDeleting] = useState<TarefaComEtapa | null>(null)

  // Arrastar exige um deslocamento mínimo, senão o clique nos botões de editar
  // e excluir do card é engolido pelo gesto de drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const allTasks = useMemo<TarefaComEtapa[]>(
    () =>
      stages.flatMap(({ stage, tasks }) =>
        tasks.map((tarefa) => ({ tarefa, stageId: stage.id, stageName: stage.name })),
      ),
    [stages],
  )

  const filtered = useMemo(
    () => (stageFilter === "ALL" ? allTasks : allTasks.filter((i) => String(i.stageId) === stageFilter)),
    [allTasks, stageFilter],
  )

  const moveMutation = useMutation({
    mutationFn: ({ stageId, id, status }: { stageId: number; id: number; status: TarefaStatus }) =>
      updateTarefa(stageId, id, { status }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tarefas", variables.stageId] })
      queryClient.invalidateQueries({ queryKey: ["stages", projectId] })
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.tarefas.toasts.errorMoving"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ stageId, id }: { stageId: number; id: number }) => deleteTarefa(stageId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tarefas", variables.stageId] })
      setDeleting(null)
      toast.success(t("obra.tarefas.toasts.deleted"))
    },
    onError: (error: Error) => {
      toast.error(error.message || t("obra.tarefas.toasts.errorDeleting"))
    },
  })

  function handleDragEnd(event: DragEndEvent) {
    const target = event.over?.id as TarefaStatus | undefined
    const data = event.active.data.current as { tarefa: Tarefa; stageId: number } | undefined
    if (!target || !data || data.tarefa.status === target) return

    moveMutation.mutate({ stageId: data.stageId, id: data.tarefa.id, status: target })
  }

  const firstStageId = stages[0]?.stage.id ?? null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((c) => (
          <div key={c.status} className="h-56 animate-pulse rounded-2xl bg-surface-container-low" />
        ))}
      </div>
    )
  }

  if (stages.length === 0) {
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
          <Select value={stageFilter} onChange={(e) => setStageFilter(e.currentTarget.value)}>
            <option value="ALL">{t("obra.tarefas.allStages")}</option>
            {stages.map(({ stage }) => (
              <option key={stage.id} value={String(stage.id)}>
                {stage.name}
              </option>
            ))}
          </Select>
        </div>

        <Num className="text-[11.5px] text-on-surface-variant">
          {t("obra.tarefas.count", { count: filtered.length })}
        </Num>

        {canMutate && firstStageId !== null && (
          <Button
            variant="primary"
            fullWidth={false}
            className="ml-auto"
            onClick={() =>
              setCreateForStage(stageFilter === "ALL" ? firstStageId : Number(stageFilter))
            }
          >
            <Plus size={15} />
            {t("obra.tarefas.newTask")}
          </Button>
        )}
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map(({ status, dot }) => (
            <KanbanColumn
              key={status}
              status={status}
              dot={dot}
              items={filtered.filter((i) => i.tarefa.status === status)}
              canMutate={canMutate}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      </DndContext>

      <TaskFormModal
        open={createForStage !== null}
        onClose={() => setCreateForStage(null)}
        stageId={createForStage}
        projectId={projectId}
        canMutate={canMutate}
      />

      <TaskFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        stageId={editing?.stageId ?? null}
        projectId={projectId}
        canMutate={canMutate}
        tarefaToEdit={editing?.tarefa ?? null}
        onSaved={() => setEditing(null)}
      />

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={t("obra.tarefas.deleteTitle")}
        description={t("obra.tarefas.deleteDescription", { title: deleting?.tarefa.title ?? "" })}
        icon={<Trash2 size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="flex gap-2 px-6 pb-6">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            {t("obra.tarefas.cancel")}
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() =>
              deleting && deleteMutation.mutate({ stageId: deleting.stageId, id: deleting.tarefa.id })
            }
          >
            {t("obra.tarefas.confirmDelete")}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
