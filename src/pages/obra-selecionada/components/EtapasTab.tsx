import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { AlertTriangle, Plus, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { EtapaStatus } from "@/pages/projetos/types"

import { useAttachments } from "../hooks/useAttachments"
import { useProjectRole } from "../hooks/useProjectRole"
import { useStages, useStagesList } from "../hooks/useStages"
import type { Stage } from "../services/stages.service"
import { EtapaCard } from "./EtapaCard"
import { StageFormModal } from "./StageFormModal"

type SectionKey = "IN_PROGRESS" | "PENDING" | "DONE"

const SECTION_ORDER: SectionKey[] = ["IN_PROGRESS", "PENDING", "DONE"]

const SECTION_TITLE_KEY: Record<SectionKey, string> = {
  IN_PROGRESS: "obra.etapas.sections.inProgress",
  PENDING: "obra.etapas.sections.pending",
  DONE: "obra.etapas.sections.done",
}

const SECTION_STATUS: Record<SectionKey, EtapaStatus> = {
  IN_PROGRESS: "IN_PROGRESS",
  PENDING: "PLANNED",
  DONE: "DONE",
}

function statusToSection(status: EtapaStatus): SectionKey {
  if (status === "IN_PROGRESS") return "IN_PROGRESS"
  if (status === "DONE") return "DONE"
  return "PENDING"
}

function groupBySection(stages: Stage[]): Record<SectionKey, Stage[]> {
  const groups: Record<SectionKey, Stage[]> = {
    IN_PROGRESS: [],
    PENDING: [],
    DONE: [],
  }
  for (const stage of [...stages].sort((a, b) => a.displayOrder - b.displayOrder)) {
    groups[statusToSection(stage.status)].push(stage)
  }
  return groups
}

const dropZone = tv({
  base: "grid min-h-24 grid-cols-1 gap-4 rounded-xl sm:grid-cols-2 lg:grid-cols-3",
  variants: {
    over: {
      true: "bg-primary/5 ring-1 ring-primary/30",
      false: "",
    },
    empty: {
      true: "border border-dashed border-outline-variant/40 p-4",
      false: "",
    },
  },
})

interface DroppableSectionProps {
  sectionKey: SectionKey
  stages: Stage[]
  photoCountByStage: Map<number, number>
  onCardClick?: (stage: Stage) => void
  onCardDelete?: (stage: Stage) => void
  canDrag: boolean
  canMutate: boolean
  isEmpty: boolean
}

function DroppableSection({
  sectionKey,
  stages,
  photoCountByStage,
  onCardClick,
  onCardDelete,
  canDrag,
  canMutate,
  isEmpty,
}: DroppableSectionProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({ id: `section:${sectionKey}` })

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-on-surface text-base">
        {t(SECTION_TITLE_KEY[sectionKey])}
      </h2>
      <SortableContext
        id={`section:${sectionKey}`}
        items={stages.map(s => s.id)}
        strategy={rectSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={dropZone({ over: isOver, empty: isEmpty })}
        >
          {stages.length === 0 ? (
            <p className="text-sm text-on-surface-variant col-span-full text-center py-3">
              {t("obra.etapas.sections.emptySection")}
            </p>
          ) : (
            stages.map(stage => (
              <EtapaCard
                key={stage.id}
                stage={stage}
                photoCount={photoCountByStage.get(stage.id) ?? 0}
                onClick={onCardClick}
                onDelete={onCardDelete}
                disableDrag={!canDrag}
                canMutate={canMutate}
              />
            ))
          )}
        </div>
      </SortableContext>
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
  const { reorder, update, remove, isDeleting } = useStages(projectId)

  const [localStages, setLocalStages] = useState<Stage[]>([])
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; stage: Stage } | { mode: "closed" }
  >({ mode: "closed" })
  const [pendingDelete, setPendingDelete] = useState<Stage | null>(null)
  const [activeDragId, setActiveDragId] = useState<number | null>(null)

  useEffect(() => {
    setLocalStages(stages)
  }, [stages])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const grouped = useMemo(() => groupBySection(localStages), [localStages])

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

  const activeDragStage = useMemo(
    () => (activeDragId != null ? localStages.find(s => s.id === activeDragId) ?? null : null),
    [activeDragId, localStages],
  )

  function findSectionOfId(id: number): SectionKey | null {
    for (const key of SECTION_ORDER) {
      if (grouped[key].some(s => s.id === id)) return key
    }
    return null
  }

  function parseContainerId(raw: string | number | null | undefined): SectionKey | null {
    if (typeof raw !== "string") return null
    if (!raw.startsWith("section:")) return null
    const key = raw.slice("section:".length) as SectionKey
    return SECTION_ORDER.includes(key) ? key : null
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(typeof event.active.id === "number" ? event.active.id : Number(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeId = Number(active.id)
    const fromSection = findSectionOfId(activeId)
    if (!fromSection) return

    const toSection =
      parseContainerId(over.id) ?? findSectionOfId(Number(over.id))
    if (!toSection) return

    const activeStage = localStages.find(s => s.id === activeId)
    if (!activeStage) return

    if (fromSection === toSection) {
      const items = grouped[fromSection]
      const oldIndex = items.findIndex(s => s.id === activeId)
      const overIdNum = Number(over.id)
      const newIndex = items.findIndex(s => s.id === overIdNum)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(items, oldIndex, newIndex)

      const orderMap = new Map<number, number>()
      reordered.forEach((s, idx) => orderMap.set(s.id, idx + 1))

      setLocalStages(prev =>
        prev.map(s =>
          orderMap.has(s.id) ? { ...s, displayOrder: orderMap.get(s.id)! } : s,
        ),
      )

      const globalOrder: number[] = []
      for (const key of SECTION_ORDER) {
        const list = key === fromSection ? reordered : grouped[key]
        for (const s of list) globalOrder.push(s.id)
      }

      reorder(globalOrder)
      return
    }

    const newStatus = SECTION_STATUS[toSection]
    update({
      id: activeId,
      payload: {
        name: activeStage.name,
        description: activeStage.description,
        displayOrder: activeStage.displayOrder,
        status: newStatus,
        plannedStartDate: activeStage.plannedStartDate,
        plannedEndDate: activeStage.plannedEndDate,
      },
    })

    setLocalStages(prev =>
      prev.map(s => (s.id === activeId ? { ...s, status: newStatus } : s)),
    )
  }

  function openCreate() {
    setModalState({ mode: "create" })
  }

  function openEdit(stage: Stage) {
    setModalState({ mode: "edit", stage })
  }

  function closeModal() {
    setModalState({ mode: "closed" })
  }

  function requestDelete(stage: Stage) {
    setPendingDelete(stage)
  }

  function cancelDelete() {
    setPendingDelete(null)
  }

  function confirmDelete() {
    if (!pendingDelete) return
    remove(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    })
  }

  function renderBody() {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-40 bg-surface-container-low rounded-xl" />
            <div className="h-40 bg-surface-container-low rounded-xl" />
            <div className="h-40 bg-surface-container-low rounded-xl" />
          </div>
        </div>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-12 bg-surface-container-low rounded-xl border border-error/20">
          <p className="text-on-surface-variant text-sm">{t("obra.acompError")}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        </div>
      )
    }

    if (localStages.length > 0) {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-8">
            {SECTION_ORDER.map(section => (
              <DroppableSection
                key={section}
                sectionKey={section}
                stages={grouped[section]}
                photoCountByStage={photoCountByStage}
                onCardClick={openEdit}
                onCardDelete={requestDelete}
                canDrag={canMutate}
                canMutate={canMutate}
                isEmpty={grouped[section].length === 0}
              />
            ))}
          </div>
          <DragOverlay>
            {activeDragStage && (
              <EtapaCard
                stage={activeDragStage}
                photoCount={photoCountByStage.get(activeDragStage.id) ?? 0}
                disableDrag
              />
            )}
          </DragOverlay>
        </DndContext>
      )
    }

    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant text-sm">
        {t("obra.etapas.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface">{t("obra.etapas.title")}</h1>
        {canMutate && (
          <Button onClick={openCreate} variant="primary" className="w-auto px-4 py-2 text-sm">
            <Plus size={16} />
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
        onClose={cancelDelete}
        title={t("obra.etapas.deleteModal.title")}
        icon={<AlertTriangle size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="px-6 pb-6 space-y-5">
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {t("obra.etapas.deleteModal.message", { name: pendingDelete?.name ?? "" })}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
              {t("obra.etapas.actions.cancel")}
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-error text-on-error border-0 hover:brightness-[0.92]"
            >
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
