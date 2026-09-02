import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { AlertTriangle, ArrowUpDown, Plus, RefreshCw } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { EtapaStatus } from "@/pages/projetos/types"
import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"

import { STAGE_SECTIONS, sectionDroppableId, sectionStatusFromId } from "../constants/stageSections"
import { useAttachments } from "../hooks/useAttachments"
import { useProjectPermissions } from "../hooks/useProjectPermissions"
import { useStages, useStagesList } from "../hooks/useStages"
import { ProjectPermission } from "../services/projectPermissions.service"
import type { Stage } from "../services/stages.service"
import { EtapaCard } from "./EtapaCard"
import { StageFormModal } from "./StageFormModal"

/**
 * Etapas da obra (Telas §12) — lista vertical em seções por status.
 *
 * É um kanban deitado: cada seção é um status (Planejada · Em andamento ·
 * Concluída · Bloqueada) e as etapas continuam em linhas, na ordem do ciclo.
 * Arrastar faz duas coisas — reordenar, quando o card fica na mesma seção, e
 * mudar o status, quando cai em outra. A ordem global (`displayOrder`, que a
 * Visão geral e o backend usam) é única para a lista toda: um único
 * `SortableContext` cobre todas as seções, e as seções em si são só droppables
 * para receber cards quando estão vazias.
 *
 * `localStages` espelha a query para o arraste ser imediato: esperar o
 * round-trip faria a linha voltar ao lugar antigo antes de assentar. O
 * otimista é um *override* amarrado à referência da lista do servidor: quando
 * o refetch chega, a referência muda e o override é descartado sozinho — sem
 * `useEffect` sincronizando estado.
 */

const sectionDot = tv({
  base: "size-2 shrink-0 rounded-full",
  variants: {
    status: {
      PLANNED: "bg-on-surface-faint",
      IN_PROGRESS: "bg-gold-bright",
      DONE: "bg-ok",
      BLOCKED: "bg-warn",
    },
  },
})

const section = tv({
  base: "rounded-2xl border p-3 transition-colors lg:p-4",
  variants: {
    over: {
      true: "border-gold bg-surface-container-high",
      false: "border-transparent",
    },
  },
})

/**
 * Cards têm prioridade sobre a seção: quando o ponteiro está sobre um card,
 * o destino é a posição dele (e o status da seção dele); quando está só sobre a
 * área da seção — vazia ou nas bordas — o destino é a seção. `closestCenter`
 * puro escolheria a seção com frequência, porque o centro dela costuma estar
 * mais perto do ponteiro que o de qualquer card.
 */
const collisionDetection: CollisionDetection = (args) => {
  const within = pointerWithin(args)
  const cards = within.filter((c) => sectionStatusFromId(c.id) === null)
  if (cards.length > 0) {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) =>
        cards.some((hit) => hit.id === c.id),
      ),
    })
  }
  const sections = within.filter((c) => sectionStatusFromId(c.id) !== null)
  if (sections.length > 0) return sections
  // Teclado não tem ponteiro: cai no cálculo por distância entre todos.
  return closestCenter(args)
}

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

interface StageSectionProps {
  status: EtapaStatus
  stages: Stage[]
  canMutate: boolean
  photoCountByStage: Map<number, number>
  onEdit: (stage: Stage) => void
  onDelete: (stage: Stage) => void
}

function StageSection({
  status,
  stages,
  canMutate,
  photoCountByStage,
  onEdit,
  onDelete,
}: StageSectionProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({
    id: sectionDroppableId(status),
    disabled: !canMutate,
  })

  return (
    <section
      ref={setNodeRef}
      className={section({ over: isOver })}
      aria-label={t(`obra.etapas.etapaStatus.${status}`)}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={sectionDot({ status })} />
        <h2 className="text-[13.5px] font-semibold text-on-surface">
          {t(`obra.etapas.etapaStatus.${status}`)}
        </h2>
        <Num className="ml-auto text-[11px] font-bold text-on-surface-faint">{stages.length}</Num>
      </header>

      {stages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline p-4 text-center text-[11.5px] text-on-surface-faint">
          {t("obra.etapas.emptySection")}
        </div>
      ) : (
        <ul className="space-y-3">
          {stages.map((stage) => (
            <EtapaCard
              key={stage.id}
              stage={stage}
              photoCount={photoCountByStage.get(stage.id) ?? 0}
              onClick={onEdit}
              onDelete={onDelete}
              disableDrag={!canMutate}
              canMutate={canMutate}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

interface EtapasTabProps {
  projectId: number
  projectStartDate: string | null
}

export function EtapasTab({ projectId, projectStartDate }: EtapasTabProps) {
  const { t } = useTranslation()
  const { can } = useProjectPermissions(projectId)
  const canMutate = can(ProjectPermission.MANAGE_STAGES)
  const { attachments } = useAttachments(projectId)
  const { stages, isLoading, isError, refetch } = useStagesList(projectId)
  const { move, remove, isDeleting } = useStages(projectId)

  const sortedStages = useMemo(
    () => [...stages].sort((a, b) => a.displayOrder - b.displayOrder),
    [stages],
  )
  const [optimistic, setOptimistic] = useState<{ base: Stage[]; list: Stage[] } | null>(null)
  const localStages = optimistic?.base === sortedStages ? optimistic.list : sortedStages

  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; stage: Stage } | { mode: "closed" }
  >({ mode: "closed" })
  const [pendingDelete, setPendingDelete] = useState<Stage | null>(null)

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

  const byStatus = useMemo(() => {
    const map = new Map<EtapaStatus, Stage[]>(STAGE_SECTIONS.map((s) => [s, []]))
    for (const stage of localStages) {
      // Status fora do mapa (dado legado) cai na primeira seção em vez de sumir.
      const bucket = map.get(stage.status) ?? map.get(STAGE_SECTIONS[0])
      bucket?.push(stage)
    }
    return map
  }, [localStages])

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
    if (oldIndex === -1) return
    const moved = localStages[oldIndex]

    // Soltou sobre um card: assume a posição e a seção dele. Soltou sobre a
    // área de uma seção (vazia ou nas bordas): só muda de seção, mantendo a
    // posição na ordem global.
    const sectionStatus = sectionStatusFromId(over.id)
    let targetStatus: EtapaStatus
    let reordered: Stage[]

    if (sectionStatus !== null) {
      targetStatus = sectionStatus
      reordered = localStages
    } else {
      const newIndex = localStages.findIndex((s) => s.id === Number(over.id))
      if (newIndex === -1) return
      targetStatus = localStages[newIndex].status
      reordered = arrayMove(localStages, oldIndex, newIndex)
    }

    const statusChanged = targetStatus !== moved.status
    const orderChanged = reordered.some((s, idx) => s.id !== localStages[idx].id)
    if (!statusChanged && !orderChanged) return

    setOptimistic({
      base: sortedStages,
      list: reordered.map((s, idx) => ({
        ...s,
        displayOrder: idx + 1,
        status: s.id === moved.id ? targetStatus : s.status,
      })),
    })

    move(
      {
        stage: moved,
        status: statusChanged ? targetStatus : undefined,
        orderedIds: orderChanged ? reordered.map((s) => s.id) : undefined,
      },
      // Em erro o refetch pode voltar idêntico ao cache (mesma referência), e
      // aí o override não cairia sozinho: solta-se aqui para a lista voltar.
      { onError: () => setOptimistic(null) },
    )
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
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localStages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {STAGE_SECTIONS.map((status) => (
              <StageSection
                key={status}
                status={status}
                stages={byStatus.get(status) ?? []}
                canMutate={canMutate}
                photoCountByStage={photoCountByStage}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {canMutate && localStages.length > 0 ? (
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
        projectStartDate={projectStartDate}
        stages={localStages}
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
