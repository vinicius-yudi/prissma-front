import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { AlertTriangle, ArrowUpDown, Plus, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"

import { useAttachments } from "../hooks/useAttachments"
import { useProjectRole } from "../hooks/useProjectRole"
import { useStages, useStagesList } from "../hooks/useStages"
import type { Stage } from "../services/stages.service"
import { EtapaCard } from "./EtapaCard"
import { StageFormModal } from "./StageFormModal"

/**
 * Etapas da obra (Telas §12) — lista vertical ordenável.
 *
 * Uma lista só, na ordem do ciclo. Antes eram três seções por status e o
 * arraste servia a duas coisas ao mesmo tempo (reordenar dentro da seção,
 * mudar status entre seções); o gesto ficava ambíguo e a ordem global —
 * `displayOrder`, que é o que a Visão geral e o backend usam — se perdia entre
 * os grupos. Aqui arrastar só reordena; o status se muda no formulário.
 *
 * `localStages` espelha a query para o arraste ser imediato: esperar o
 * round-trip faria a linha voltar ao lugar antigo antes de assentar.
 */

function EmptyState({ canMutate, onCreate }: { canMutate: boolean; onCreate: () => void }) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col items-center gap-3.5 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-14 text-center">
      {/* Wireframe de construção em traço ouro — a ilustração de vazio do
          Style Guide v2 §4. */}
      <svg
        width="112"
        height="82"
        viewBox="0 0 96 72"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1.2"
        aria-hidden
      >
        <path d="M8 64h80M20 64V26l28-14 28 14v38M34 64V44h12v20M56 40h12v10H56z" />
        <path d="M20 26h56" strokeDasharray="3 4" />
      </svg>

      <p className="text-base font-semibold text-on-surface">{t("obra.etapas.emptyTitle")}</p>
      <p className="max-w-[330px] text-[13px] text-on-surface-variant">
        {t("obra.etapas.emptyHint")}
      </p>

      {canMutate && (
        <Button variant="primary" fullWidth={false} onClick={onCreate} className="mt-1">
          <Plus size={15} />
          {t("obra.etapas.emptyCta")}
        </Button>
      )}
    </section>
  )
}

interface EtapasTabProps {
  projectId: number
}

export function EtapasTab({ projectId }: EtapasTabProps) {
  const { t } = useTranslation()
  const { canMutate } = useProjectRole(projectId)
  const { attachments } = useAttachments(projectId)
  const { stages, isLoading, isError, refetch } = useStagesList(projectId)
  const { reorder, remove, isDeleting } = useStages(projectId)

  const [localStages, setLocalStages] = useState<Stage[]>([])
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; stage: Stage } | { mode: "closed" }
  >({ mode: "closed" })
  const [pendingDelete, setPendingDelete] = useState<Stage | null>(null)

  useEffect(() => {
    setLocalStages([...stages].sort((a, b) => a.displayOrder - b.displayOrder))
  }, [stages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // No toque o arraste só começa após uma pressão longa, senão o gesto de
    // rolar a página seria capturado pela alça.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const photoCountByStage = useMemo(() => {
    const map = new Map<number, number>()
    for (const a of attachments) {
      if (a.fileType?.toLowerCase().startsWith("image/") && a.stageId != null) {
        map.set(a.stageId, (map.get(a.stageId) ?? 0) + 1)
      }
    }
    return map
  }, [attachments])

  const maxDisplayOrder = useMemo(
    () => localStages.reduce((acc, s) => Math.max(acc, s.displayOrder), 0),
    [localStages],
  )

  function openCreate() {
    setModalState({ mode: "create" })
  }

  // Precisa vir antes de qualquer early return: é o que alimenta o FAB da
  // barra de abas no celular.
  usePrimaryAction(
    canMutate ? { label: t("obra.etapas.actions.create"), onClick: openCreate } : null,
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localStages.findIndex((s) => s.id === Number(active.id))
    const newIndex = localStages.findIndex((s) => s.id === Number(over.id))
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localStages, oldIndex, newIndex)
    setLocalStages(reordered.map((s, idx) => ({ ...s, displayOrder: idx + 1 })))
    reorder(reordered.map((s) => s.id))
  }

  function openEdit(stage: Stage) {
    setModalState({ mode: "edit", stage })
  }

  function closeModal() {
    setModalState({ mode: "closed" })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    remove(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }

  function renderBody() {
    if (isLoading) {
      return (
        <ul className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="h-[76px] animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </ul>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-low p-12">
          <p className="text-sm text-on-surface-variant">{t("obra.acompError")}</p>
          <Button variant="outline" fullWidth={false} onClick={() => refetch()}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        </div>
      )
    }

    if (localStages.length === 0) {
      return <EmptyState canMutate={canMutate} onCreate={openCreate} />
    }

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {localStages.map((stage) => (
              <EtapaCard
                key={stage.id}
                stage={stage}
                photoCount={photoCountByStage.get(stage.id) ?? 0}
                onClick={openEdit}
                onDelete={setPendingDelete}
                disableDrag={!canMutate}
                canMutate={canMutate}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canMutate && localStages.length > 1 ? (
          <p className="hidden items-center gap-2 text-[12px] text-on-surface-faint lg:flex">
            <ArrowUpDown size={14} />
            {t("obra.etapas.reorderHint")}
          </p>
        ) : (
          <span />
        )}

        {canMutate && (
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={openCreate}
            // No celular quem cria é o FAB da barra de abas — dois botões de
            // criação na mesma vista competiriam entre si.
            className="ml-auto hidden lg:inline-flex"
          >
            <Plus size={15} />
            {t("obra.etapas.actions.create")}
          </Button>
        )}
      </div>

      {renderBody()}

      <StageFormModal
        open={modalState.mode !== "closed"}
        onClose={closeModal}
        projectId={projectId}
        stage={modalState.mode === "edit" ? modalState.stage : null}
        suggestedDisplayOrder={maxDisplayOrder + 1}
        canMutate={canMutate}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t("obra.etapas.deleteModal.title")}
        icon={<AlertTriangle size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="space-y-5 px-6 pb-6">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {t("obra.etapas.deleteModal.message", { name: pendingDelete?.name ?? "" })}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {t("obra.etapas.actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting
                ? t("obra.etapas.deleteModal.deleting")
                : t("obra.etapas.deleteModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
