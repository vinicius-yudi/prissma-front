import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Segmented } from "@/shared/components/ui/segmented/Segmented"
import { useAccess } from "@/shared/hooks/useAccess"
import { getMyProfile } from "@/shared/services/user.service"

import { ALL_TYPES, DIARY_TYPES } from "../constants/diario"
import { useAttachments } from "../hooks/useAttachments"
import { useDiario } from "../hooks/useDiario"
import { useDiarioComposer } from "../hooks/useDiarioComposer"
import type { DiarioEntry, DiarioEntryType } from "../types/diario"
import { DeleteDiaryModal } from "./diario/DeleteDiaryModal"
import { DiaryComposer } from "./diario/DiaryComposer"
import { DiaryEntryModal } from "./diario/DiaryEntryModal"
import { DiaryTimeline } from "./diario/DiaryTimeline"

/** `?tipo=DELIVERY` filtra a linha do tempo (CLAUDE.md §8). */
const TYPE_PARAM = "tipo"

/** Sem o compositor (só leitura), a linha do tempo ocupa a largura toda. */
const timeline = tv({ variants: { full: { true: "xl:col-span-2" } } })

type TypeFilter = typeof ALL_TYPES | DiarioEntryType

function readFilter(value: string | null): TypeFilter {
  return DIARY_TYPES.find((type) => type === value) ?? ALL_TYPES
}

/**
 * Diário da obra (redesign): o compositor "Registro de hoje" à esquerda e a
 * linha do tempo agrupada por dia à direita, com filtro por tipo na URL.
 */
export default function DiarioDaObra({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const diario = useDiario(projectId)
  const attachments = useAttachments(projectId)
  const { isReadOnly } = useAccess()
  const canWrite = !isReadOnly("diario")
  const me = useQuery({ queryKey: ["me"], queryFn: getMyProfile })
  const composer = useDiarioComposer({ create: diario.create, upload: attachments.upload })
  const [params, setParams] = useSearchParams()
  const [opened, setOpened] = useState<DiarioEntry | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DiarioEntry | null>(null)

  const filter = readFilter(params.get(TYPE_PARAM))
  const visible = filter === ALL_TYPES ? diario.entries : diario.entries.filter((entry) => entry.entryType === filter)
  const openedAttachment = attachments.attachments.find((a) => a.id === opened?.attachmentId) ?? null

  function setFilter(next: TypeFilter) {
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        if (next === ALL_TYPES) nextParams.delete(TYPE_PARAM)
        else nextParams.set(TYPE_PARAM, next)
        return nextParams
      },
      { replace: true },
    )
  }

  function confirmDelete() {
    if (!pendingDelete) return
    diario.delete(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:items-start">
      {canWrite && (
        <DiaryComposer composer={composer} authorName={me.data?.name ?? null} isSaving={diario.isCreating} isUploading={attachments.isUploading} />
      )}

      <div className={timeline({ full: !canWrite })}>
        <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          <Segmented
            id="diary-filter"
            size="sm"
            label={t("obra.diario.filterLabel")}
            value={filter}
            onChange={setFilter}
            options={[
              { value: ALL_TYPES, label: t("obra.diario.filters.all") },
              ...DIARY_TYPES.map((type) => ({ value: type, label: t(`obra.diario.filters.${type}`) })),
            ]}
          />
        </div>

        <DiaryTimeline
          entries={visible}
          isLoading={diario.isLoading}
          isError={!!diario.error}
          filtered={filter !== ALL_TYPES}
          canDelete={canWrite}
          onRetry={() => diario.refetch()}
          onClearFilter={() => setFilter(ALL_TYPES)}
          onOpen={setOpened}
          onDelete={setPendingDelete}
        />

        {diario.hasNextPage && (
          <Button variant="outline" size="sm" fullWidth={false} onClick={() => diario.fetchNextPage()} disabled={diario.isFetchingNextPage} className="mt-6">
            {diario.isFetchingNextPage ? t("obra.diario.loadingMore") : t("obra.diario.loadMore")}
          </Button>
        )}
      </div>

      <DiaryEntryModal projectId={projectId} entry={opened} attachment={openedAttachment} onClose={() => setOpened(null)} />
      <DeleteDiaryModal entry={pendingDelete} isDeleting={diario.isDeleting} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />
    </div>
  )
}
