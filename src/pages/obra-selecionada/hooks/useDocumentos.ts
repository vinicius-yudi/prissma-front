import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import {
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_MB,
  isDocumentMime,
} from "@/shared/constants/attachments"
import type { Attachment } from "@/shared/types/attachment"

import { downloadAttachment, triggerFileDownload } from "../services/attachments.service"
import { DOCUMENTO_LABELS, useAttachments } from "./useAttachments"

/**
 * Documentos da obra: validação de upload e download.
 *
 * Os dois erros de upload são deliberadamente distintos — "maior que o
 * permitido" e "tipo não suportado" pedem correções diferentes do usuário, e
 * colapsá-los num "arquivo inválido" genérico deixaria a pessoa sem saber o
 * que ajustar.
 *
 * A validação é local porque o backend também valida (tamanho, content-type e
 * magic bytes): aqui é para dar retorno imediato, não para substituí-la.
 */

interface UseDocumentosResult {
  documents: Attachment[]
  isLoading: boolean
  isUploading: boolean
  /** Valida e envia. Recusa com toast específico quando não passa. */
  submitFile: (file: File) => void
  remove: (id: number) => void
  downloadingId: number | null
  download: (attachment: Attachment) => Promise<void>
}

export function useDocumentos(projectId: number): UseDocumentosResult {
  const { t } = useTranslation()
  const { attachments, isLoading, upload, isUploading, remove } = useAttachments(projectId, {
    labels: DOCUMENTO_LABELS,
  })
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  function submitFile(file: File) {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      toast.error(t("obra.attachments.fileTooLarge", { max: MAX_ATTACHMENT_SIZE_MB }))
      return
    }
    if (!isDocumentMime(file.type)) {
      toast.error(t("obra.documentos.unsupportedType"))
      return
    }
    upload(file)
  }

  async function download(attachment: Attachment) {
    setDownloadingId(attachment.id)
    try {
      const blob = await downloadAttachment(projectId, attachment.id)
      triggerFileDownload(blob, attachment.fileName)
    } catch {
      toast.error(t("obra.documentos.downloadError"))
    } finally {
      setDownloadingId(null)
    }
  }

  return {
    documents: attachments.filter((a) => isDocumentMime(a.fileType)),
    isLoading,
    isUploading,
    submitFile,
    remove,
    downloadingId,
    download,
  }
}
