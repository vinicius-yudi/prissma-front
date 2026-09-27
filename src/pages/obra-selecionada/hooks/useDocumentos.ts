import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { MAX_ATTACHMENT_SIZE_BYTES, MAX_ATTACHMENT_SIZE_MB } from "@/shared/constants/attachments"
import type { Attachment } from "@/shared/types/attachment"

import { downloadAttachment, triggerFileDownload } from "../services/attachments.service"
import { isAcceptedFile } from "../utils/documentKind"
import { DOCUMENTO_LABELS, useAttachments } from "./useAttachments"

/** Arquivos por envio — o protótipo limita a 8 para a fila caber na tela. */
export const MAX_BATCH = 8

export interface PendingUpload {
  key: string
  name: string
}

interface UseDocumentosResult {
  /** Todos os anexos da obra, do mais recente ao mais antigo. */
  documents: Attachment[]
  isLoading: boolean
  /** Arquivos na fila de envio (o `fetch` não dá progresso, então é por item). */
  pending: PendingUpload[]
  /** Valida e envia em sequência; o que não passa sai com o motivo. */
  submitFiles: (files: File[], stageId: number | null) => Promise<void>
  remove: (id: number, onSuccess: () => void) => void
  isDeleting: boolean
  downloadingId: number | null
  download: (attachment: Attachment) => Promise<void>
}

/**
 * Documentos da obra: validação, fila de envio e download.
 *
 * Os dois erros de validação são distintos de propósito — "maior que o
 * permitido" e "tipo não suportado" pedem correções diferentes. A validação
 * local é retorno imediato; o backend valida de novo (tamanho, tipo e magic
 * bytes).
 */
export function useDocumentos(projectId: number): UseDocumentosResult {
  const { t } = useTranslation()
  const { attachments, isLoading, uploadAsync, remove, isDeleting } = useAttachments(projectId, { labels: DOCUMENTO_LABELS })
  const [pending, setPending] = useState<PendingUpload[]>([])
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  function accepts(file: File): boolean {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(t("obra.attachments.fileTooLarge", { max: MAX_ATTACHMENT_SIZE_MB }))
      return false
    }
    if (!isAcceptedFile(file)) {
      toast.error(t("obra.documentos.unsupportedType", { name: file.name }))
      return false
    }
    return true
  }

  async function submitFiles(files: File[], stageId: number | null) {
    if (files.length > MAX_BATCH) toast.info(t("obra.documentos.batchLimit", { max: MAX_BATCH }))
    const batch = files.slice(0, MAX_BATCH).filter(accepts)
    const queued = batch.map((file, i) => ({ file, key: `${Date.now()}-${i}-${file.name}` }))
    setPending((list) => [...list, ...queued.map(({ key, file }) => ({ key, name: file.name }))])
    for (const { file, key } of queued) {
      try {
        await uploadAsync({ file, stageId })
      } catch {
        // O toast de erro sai do hook de upload; a fila segue.
      } finally {
        setPending((list) => list.filter((item) => item.key !== key))
      }
    }
  }

  async function download(attachment: Attachment) {
    setDownloadingId(attachment.id)
    try {
      triggerFileDownload(await downloadAttachment(projectId, attachment.id), attachment.fileName)
    } catch {
      toast.error(t("obra.documentos.downloadError"))
    } finally {
      setDownloadingId(null)
    }
  }

  return {
    documents: [...attachments].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    isLoading,
    pending,
    submitFiles,
    remove: (id, onSuccess) => remove(id, { onSuccess }),
    isDeleting,
    downloadingId,
    download,
  }
}
