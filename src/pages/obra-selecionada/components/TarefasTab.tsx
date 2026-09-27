import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { GlobalRole } from "@/shared/types/user"

import { COLUMN_STATUSES } from "../constants/kanban"
import { useObraMembers } from "../hooks/useObraMembers"
import { useTarefasKanban } from "../hooks/useTarefasKanban"
import type { TarefaComEtapa } from "../types/tarefas"
import { DeleteTaskModal } from "./tarefas/DeleteTaskModal"
import { TaskBoard } from "./tarefas/TaskBoard"
import { TaskDrawer } from "./tarefas/TaskDrawer"
import { TaskToolbar } from "./tarefas/TaskToolbar"

/** O que o drawer mostra: nada, uma tarefa (pelo id) ou o formulário de criar. */
type DrawerState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; id: number }

interface TarefasTabProps {
  projectId: number
}

/**
 * Tarefas em kanban (redesign): a coluna é o status, arrastar muda o status,
 * o card abre um drawer que salva sozinho. Filtros ficam na URL.
 */
export function TarefasTab({ projectId }: TarefasTabProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const kanban = useTarefasKanban(projectId)
  const { list: members } = useObraMembers(projectId)
  const [drawer, setDrawer] = useState<DrawerState>({ mode: "closed" })
  const [pendingDelete, setPendingDelete] = useState<TarefaComEtapa | null>(null)

  // O item vem sempre do cache vivo: o drawer enxerga o que o otimista mudou.
  const openItem = drawer.mode === "edit" ? (kanban.all.find((i) => i.tarefa.id === drawer.id) ?? null) : null
  // O backend só aceita engenheiro como responsável de tarefa (TaskService).
  const assignees = members.filter((m) => m.user.role === GlobalRole.ENG).map((m) => ({ id: m.user.id, name: m.user.name }))
  const canCreate = kanban.canMutate && kanban.stages.length > 0

  function openCreate() {
    setDrawer({ mode: "create" })
  }

  // Antes dos early returns: alimenta a ação flutuante do celular.
  usePrimaryAction(canCreate ? { label: t("obra.tarefas.newTask"), onClick: openCreate } : null)

  function confirmDelete() {
    if (!pendingDelete) return
    kanban.actions.removeAsync(pendingDelete).then(
      () => {
        setPendingDelete(null)
        setDrawer({ mode: "closed" })
      },
      () => undefined,
    )
  }

  if (kanban.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        {COLUMN_STATUSES.map((status) => (
          <div key={status} className="h-64 animate-pulse rounded-[18px] bg-raised/70" />
        ))}
      </div>
    )
  }

  if (kanban.stages.length === 0) {
    return (
      <EmptyState
        title={t("obra.tarefas.noStagesTitle")}
        body={t("obra.tarefas.noStagesHint")}
        action={
          <Button variant="outline" fullWidth={false} onClick={() => navigate("../etapas", { relative: "path" })}>
            {t("obra.tarefas.goToStages")}
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <TaskToolbar
        filterState={kanban.filterState}
        stages={kanban.stages}
        lateCount={kanban.lateCount}
        visibleCount={kanban.visible.length}
        onCreate={canCreate ? openCreate : undefined}
      />

      <TaskBoard kanban={kanban} onOpen={(item) => setDrawer({ mode: "edit", id: item.tarefa.id })} />

      <TaskDrawer
        open={drawer.mode === "create" || openItem !== null}
        onClose={() => setDrawer({ mode: "closed" })}
        onDelete={() => setPendingDelete(openItem)}
        item={openItem}
        stages={kanban.stages}
        defaultStage={kanban.targetStage}
        assignees={assignees}
        actions={kanban.actions}
        canMutate={kanban.canMutate}
      />

      <DeleteTaskModal
        item={pendingDelete}
        isDeleting={kanban.actions.isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
