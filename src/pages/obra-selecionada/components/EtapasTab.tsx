import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { useProjectProgress } from "@/pages/projetos/hooks/useProjectProgress"
import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import { EtapaStatus } from "@/pages/projetos/types"
import { Button } from "@/shared/components/ui/button/Button"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { Segmented } from "@/shared/components/ui/segmented/Segmented"

import { useAttachments } from "../hooks/useAttachments"
import { useProjectPermissions } from "../hooks/useProjectPermissions"
import { useStages, useStagesList } from "../hooks/useStages"
import { ProjectPermission } from "../services/projectPermissions.service"
import type { Stage } from "../services/stages.service"
import { DeleteStageModal } from "./etapas/DeleteStageModal"
import { StageList } from "./etapas/StageList"
import { StagesContent } from "./etapas/StagesContent"
import { StageFormModal } from "./StageFormModal"

/** `?vista=cronograma` troca a lista pelo Gantt (CLAUDE.md §8: vista na URL). */
const VIEW_PARAM = "vista"
const GANTT = "cronograma"
const LIST = "lista"
type StagesView = typeof LIST | typeof GANTT

type ModalState = { mode: "create" } | { mode: "edit"; stage: Stage } | { mode: "closed" }

interface EtapasTabProps {
  projectId: number
  projectStartDate: string | null
}

/**
 * Etapas da obra (DS v2): o ciclo em uma lista ordenada, com o avanço real de
 * cada etapa, ou o mesmo ciclo como cronograma. Reordenar é arrastar pela
 * alça (ou subir/descer); status se troca no próprio pill.
 *
 * O otimista é um override amarrado à referência da lista do servidor: quando
 * o refetch chega, a referência muda e o override cai sozinho — sem
 * `useEffect` sincronizando estado.
 */
export function EtapasTab({ projectId, projectStartDate }: EtapasTabProps) {
  const { t } = useTranslation()
  const { can } = useProjectPermissions(projectId)
  const canMutate = can(ProjectPermission.MANAGE_STAGES)
  const { attachments } = useAttachments(projectId)
  const { stages, isLoading, isError, refetch } = useStagesList(projectId)
  const { move, remove, isDeleting } = useStages(projectId)
  const progress = useProjectProgress(projectId)
  const [searchParams, setSearchParams] = useSearchParams()
  const view: StagesView = searchParams.get(VIEW_PARAM) === GANTT ? GANTT : LIST

  const sorted = [...stages].sort((a, b) => a.displayOrder - b.displayOrder)
  const [optimistic, setOptimistic] = useState<{ base: Stage[]; list: Stage[] } | null>(null)
  const local = optimistic?.base === stages ? optimistic.list : sorted
  const [modal, setModal] = useState<ModalState>({ mode: "closed" })
  // Nova `key` a cada abertura: o formulário lê os valores iniciais no mount.
  const [formKey, setFormKey] = useState(0)
  const [pendingDelete, setPendingDelete] = useState<Stage | null>(null)

  const summaries = new Map(progress.stages.map((s) => [s.id, s]))
  const photoCountByStage = new Map<number, number>()
  for (const a of attachments) {
    if (a.fileType?.toLowerCase().startsWith("image/") && a.stageId != null) {
      photoCountByStage.set(a.stageId, (photoCountByStage.get(a.stageId) ?? 0) + 1)
    }
  }
  const doneCount = local.filter((s) => s.status === EtapaStatus.DONE).length
  const maxDisplayOrder = local.reduce((acc, s) => Math.max(acc, s.displayOrder), 0)

  function openModal(next: ModalState) {
    setFormKey((k) => k + 1)
    setModal(next)
  }

  function openCreate() {
    openModal({ mode: "create" })
  }

  function openEdit(stage: Stage) {
    openModal({ mode: "edit", stage })
  }

  // Antes de qualquer early return: alimenta a ação flutuante do celular.
  usePrimaryAction(canMutate ? { label: t("obra.etapas.actions.create"), onClick: openCreate } : null)

  function setView(next: StagesView) {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === GANTT) params.set(VIEW_PARAM, GANTT)
        else params.delete(VIEW_PARAM)
        return params
      },
      { replace: true },
    )
  }

  function handleReorder(stage: Stage, orderedIds: number[]) {
    const byId = new Map(local.map((s) => [s.id, s]))
    const list = orderedIds.map((id, i) => ({ ...(byId.get(id) as Stage), displayOrder: i + 1 }))
    setOptimistic({ base: stages, list })
    // Em erro o refetch pode voltar com a mesma referência e o override não
    // cairia sozinho: solta-se aqui para a lista voltar ao lugar.
    move({ stage, orderedIds }, { onError: () => setOptimistic(null) })
  }

  function handleStatus(stage: Stage, status: EtapaStatus) {
    if (status === stage.status) return
    setOptimistic({ base: stages, list: local.map((s) => (s.id === stage.id ? { ...s, status } : s)) })
    move({ stage, status }, { onError: () => setOptimistic(null) })
  }

  function handleSelectInGantt(summary: StageSummary) {
    const stage = local.find((s) => s.id === summary.id)
    if (stage && canMutate) openEdit(stage)
  }

  function confirmDelete() {
    if (!pendingDelete) return
    remove(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="t-section text-[18px] text-ink">{t("obra.etapas.summary", { done: doneCount, total: local.length })}</p>
          {canMutate && local.length > 0 && <p className="text-[13px] text-meta">{t("obra.etapas.reorderHint")}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            id="stages-view"
            size="sm"
            label={t("obra.etapas.viewLabel")}
            value={view}
            onChange={setView}
            options={[
              { value: LIST, label: t("obra.etapas.views.list") },
              { value: GANTT, label: t("obra.etapas.views.gantt") },
            ]}
          />
          {canMutate && (
            <Button size="sm" fullWidth={false} onClick={openCreate} className="hidden lg:inline-flex">
              <Plus size={15} />
              {t("obra.etapas.actions.create")}
            </Button>
          )}
        </div>
      </div>

      <StagesContent
        isLoading={isLoading}
        isError={isError}
        stages={local}
        showGantt={view === GANTT}
        summaries={progress.stages}
        canMutate={canMutate}
        onRetry={() => refetch()}
        onCreate={openCreate}
        onSelectInGantt={handleSelectInGantt}
        list={
          <StageList
            stages={local}
            summaries={summaries}
            photoCountByStage={photoCountByStage}
            canMutate={canMutate}
            onReorder={handleReorder}
            onStatus={handleStatus}
            onEdit={openEdit}
            onDelete={setPendingDelete}
          />
        }
      />

      <StageFormModal
        key={formKey}
        open={modal.mode !== "closed"}
        onClose={() => setModal({ mode: "closed" })}
        projectId={projectId}
        projectStartDate={projectStartDate}
        stages={local}
        stage={modal.mode === "edit" ? modal.stage : null}
        suggestedDisplayOrder={maxDisplayOrder + 1}
        canMutate={canMutate}
      />

      <DeleteStageModal
        stage={pendingDelete}
        isDeleting={isDeleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
