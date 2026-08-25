import { FileText } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_MB,
  isDocumentMime,
} from "@/shared/constants/attachments"
import { Num } from "@/shared/components/ui/num/Num"
import type { Attachment } from "@/shared/types/attachment"

import { DOCUMENTO_LABELS, useAttachments } from "../hooks/useAttachments"
import { downloadAttachment, triggerFileDownload } from "../services/attachments.service"
import { AttachmentDropzone } from "./AttachmentDropzone"
import { DocumentRow } from "./DocumentRow"

interface DocumentosTabProps {
  projectId: number
}

/**
 * Documentos & anexos (Telas §18).
 *
 * A dropzone é a ação principal e fica no topo — não um botão discreto no
 * canto. Os dois erros de upload são distintos e assim precisam permanecer:
 * "maior que o permitido" e "tipo não suportado" pedem correções diferentes.
 */
export function DocumentosTab({ projectId }: DocumentosTabProps) {
  const { t } = useTranslation()
  const { attachments, isLoading, upload, isUploading, remove } = useAttachments(projectId, {
    labels: DOCUMENTO_LABELS,
  })
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const documents = attachments.filter((a) => isDocumentMime(a.fileType))

  function handleFile(file: File) {
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

  async function handleDownload(attachment: Attachment) {
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-surface-container-low" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-container-low" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-container-low" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AttachmentDropzone
        accept={DOCUMENT_ACCEPT_ATTRIBUTE}
        acceptLabel="PDF · DOCX"
        maxSizeMb={MAX_ATTACHMENT_SIZE_MB}
        isUploading={isUploading}
        onFile={handleFile}
      />

      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-on-surface">
            {t("obra.documentos.title")}
          </h2>
          <Num className="text-[11.5px] text-on-surface-faint">
            {t("obra.documentos.count", { count: documents.length })}
          </Num>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <FileText size={24} strokeWidth={1.6} className="text-on-surface-faint" />
            <p className="text-sm text-on-surface-variant">{t("obra.documentos.empty")}</p>
          </div>
        ) : (
          <div>
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                attachment={doc}
                isDownloading={downloadingId === doc.id}
                onDownload={handleDownload}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
