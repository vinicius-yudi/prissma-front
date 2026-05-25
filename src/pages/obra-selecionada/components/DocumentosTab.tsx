import type { ChangeEvent } from "react"
import { useRef, useState } from "react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import type { Attachment } from "@/shared/types/attachment"
import { Button } from "@/shared/components/ui/button/Button"

import { downloadAttachment, triggerFileDownload } from "../services/attachments.service"
import { DOCUMENTO_LABELS, useAttachments } from "../hooks/useAttachments"
import { DocumentRow } from "./DocumentRow"

const PDF_TYPE = "application/pdf"

interface DocumentosTabProps {
  projectId: number
}

function DocumentosEmpty() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-12 text-sm text-on-surface-variant">
      {t("obra.documentos.empty")}
    </div>
  )
}

export function DocumentosTab({ projectId }: DocumentosTabProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { attachments, isLoading, upload, isUploading, remove } = useAttachments(projectId, { labels: DOCUMENTO_LABELS })
  const [downloadingId, setDownloadingId] = useState<number | null>(null)

  const documents = attachments.filter(a => a.fileType === PDF_TYPE)

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    upload(file)
    e.target.value = ""
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
      <div className="bg-surface-container-low rounded-xl p-6 space-y-3">
        <div className="h-4 w-36 bg-surface-container-highest rounded animate-pulse" />
        <div className="h-12 bg-surface-container-highest rounded-lg animate-pulse" />
        <div className="h-12 bg-surface-container-highest rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          {t("obra.documentos.title")}
        </h2>
        <Button
          variant="outline"
          className="w-auto px-3 py-2 text-sm"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          <Plus size={14} />
          {isUploading ? t("obra.documentos.uploading") : t("obra.documentos.add")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {documents.length === 0 && <DocumentosEmpty />}

      {documents.length > 0 && (
        <div>
          {documents.map(doc => (
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
    </div>
  )
}
