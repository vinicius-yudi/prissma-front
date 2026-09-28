import { UploadCloud } from "lucide-react"
import { useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { ATTACHMENT_ACCEPT_ATTRIBUTE, MAX_ATTACHMENT_SIZE_MB } from "@/shared/constants/attachments"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { Segmented } from "@/shared/components/ui/segmented/Segmented"
import { useAccess } from "@/shared/hooks/useAccess"

import { MAX_BATCH, useDocumentos } from "../hooks/useDocumentos"
import { useObraMembers } from "../hooks/useObraMembers"
import { useStagesList } from "../hooks/useStages"
import { DOC_KINDS, kindOf, type DocKind } from "../utils/documentKind"
import { DocumentList } from "./documentos/DocumentList"
import { DocumentsDropzone } from "./documentos/DocumentsDropzone"
import { UploadQueue } from "./documentos/UploadQueue"

/** `?tipo=pdf` filtra a lista (CLAUDE.md §8). */
const KIND_PARAM = "tipo"
const ALL = "all"
type KindFilter = typeof ALL | DocKind

interface DocumentosTabProps {
  projectId: number
}

/**
 * Documentos (redesign): zona de envio sobre blueprint, fila de envio, filtro
 * por tipo com contagem e a lista com ações no hover.
 */
export function DocumentosTab({ projectId }: DocumentosTabProps) {
  const { t } = useTranslation()
  const { isReadOnly } = useAccess()
  const canWrite = !isReadOnly("documentos")
  const docs = useDocumentos(projectId)
  const { stages } = useStagesList(projectId)
  const { list: members } = useObraMembers(projectId)
  const [stageId, setStageId] = useState<number | null>(null)
  const [params, setParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // Antes dos early returns: o FAB do celular abre o mesmo seletor.
  usePrimaryAction(canWrite ? { label: t("obra.documentos.add"), icon: UploadCloud, onClick: () => inputRef.current?.click() } : null)

  const counts = new Map<DocKind, number>()
  for (const doc of docs.documents) counts.set(kindOf(doc), (counts.get(kindOf(doc)) ?? 0) + 1)
  const filter: KindFilter = DOC_KINDS.find((kind) => kind === params.get(KIND_PARAM)) ?? ALL
  const shown = filter === ALL ? docs.documents : docs.documents.filter((doc) => kindOf(doc) === filter)

  function setFilter(next: KindFilter) {
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        if (next === ALL) nextParams.delete(KIND_PARAM)
        else nextParams.set(KIND_PARAM, next)
        return nextParams
      },
      { replace: true },
    )
  }

  if (docs.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-48 animate-pulse rounded-[20px] bg-surface hairline" />
        <div className="h-40 animate-pulse rounded-lg bg-surface hairline" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {canWrite && (
        <DocumentsDropzone
          accept={ATTACHMENT_ACCEPT_ATTRIBUTE}
          maxSizeMb={MAX_ATTACHMENT_SIZE_MB}
          maxBatch={MAX_BATCH}
          stages={stages}
          stageId={stageId}
          onStageChange={setStageId}
          onFiles={(files) => void docs.submitFiles(files, stageId)}
          inputRef={inputRef}
        />
      )}

      <UploadQueue pending={docs.pending} />

      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
        <Segmented
          id="document-kind"
          size="sm"
          label={t("obra.documentos.filterLabel")}
          value={filter}
          onChange={setFilter}
          options={[
            { value: ALL, label: t("obra.documentos.kinds.all"), count: docs.documents.length },
            ...DOC_KINDS.filter((kind) => counts.get(kind)).map((kind) => ({ value: kind, label: t(`obra.documentos.kinds.${kind}`), count: counts.get(kind) })),
          ]}
        />
      </div>

      <DocumentList
        documents={shown}
        filtered={filter !== ALL}
        stageById={new Map(stages.map((stage) => [stage.id, stage.name]))}
        memberById={new Map(members.map((member) => [member.user.id, member.user.name]))}
        downloadingId={docs.downloadingId}
        canDelete={canWrite}
        onClearFilter={() => setFilter(ALL)}
        onDownload={(doc) => void docs.download(doc)}
        onDelete={docs.remove}
      />
    </div>
  )
}
