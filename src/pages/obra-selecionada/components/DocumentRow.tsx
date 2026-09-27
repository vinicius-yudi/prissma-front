import { Download, FileText, Loader2, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Attachment } from "@/shared/types/attachment"
import { formatDate } from "@/shared/utils/formatters"

interface DocumentRowProps {
  attachment: Attachment
  isDownloading: boolean
  onDownload: (attachment: Attachment) => void
  onRemove: (id: number) => void
}

export function DocumentRow({ attachment, isDownloading, onDownload, onRemove }: DocumentRowProps) {
  const { t } = useTranslation()

  function handleDownload() {
    onDownload(attachment)
  }

  function handleRemove() {
    onRemove(attachment.id)
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0">
      <div className="shrink-0 p-2 bg-gold/10 rounded-lg">
        <FileText size={16} className="text-gold" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{attachment.fileName}</p>
        <p className="text-xs text-ink-2">{formatDate(attachment.uploadedAt)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gold border border-gold/30 rounded-lg hover:bg-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading && <Loader2 size={12} className="animate-spin" />}
          {!isDownloading && <Download size={12} />}
          {isDownloading ? t("obra.documentos.downloading") : t("obra.documentos.download")}
        </button>

        <button
          type="button"
          onClick={handleRemove}
          className="p-1.5 text-ink-2 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
