import { Download } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { Attachment } from "@/shared/types/attachment"

import { DIARY_ICON } from "../../constants/diario"
import { useAttachmentPreview } from "../../hooks/useAttachmentPreview"
import { downloadAttachment, triggerFileDownload } from "../../services/attachments.service"
import type { DiarioEntry } from "../../types/diario"
import { AttachmentImage } from "../AttachmentImage"

interface DiaryEntryModalProps {
  projectId: number
  entry: DiarioEntry | null
  /** Anexo do registro, achado na lista de anexos da obra. */
  attachment: Attachment | null
  onClose: () => void
}

/** Registro inteiro: tipo, data, responsável, texto e o anexo com prévia e download. */
export function DiaryEntryModal({ projectId, entry, attachment, onClose }: DiaryEntryModalProps) {
  const { t, i18n } = useTranslation()
  const preview = useAttachmentPreview(projectId, attachment)
  const Icon = entry ? DIARY_ICON[entry.entryType] : null

  async function handleDownload(file: Attachment) {
    try {
      triggerFileDownload(await downloadAttachment(projectId, file.id), file.fileName)
    } catch {
      toast.error(t("obra.diario.details.attachmentError"))
    }
  }

  return (
    <Modal open={entry !== null} onClose={onClose} title={t("obra.diario.details.title")} icon={Icon && <Icon size={18} />} size="lg">
      {entry && (
        <div className="space-y-5 px-6 pt-2 pb-6">
          <p className="text-[13px] text-meta">
            <span className="font-[620] text-ink-2">{t(`obra.diario.types.${entry.entryType}`)}</span> ·{" "}
            <span className="t-num">{new Date(entry.entryDate).toLocaleString(i18n.language, { dateStyle: "long", timeStyle: "short" })}</span>
          </p>

          <div className="flex items-center gap-2 text-[14px] text-ink">
            <Avatar name={entry.responsibleName} size={28} />
            <span>{entry.responsibleName}</span>
          </div>

          <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap text-ink">{entry.description}</p>

          <div>
            <h3 className="t-label mb-2 text-ink-2">{t("obra.diario.details.attachment")}</h3>
            {!entry.attachmentId && <p className="text-[13.5px] text-meta">{t("obra.diario.details.noAttachment")}</p>}
            {entry.attachmentId && !attachment && <p className="text-[13.5px] text-meta">{t("obra.diario.details.attachmentUnavailable")}</p>}
            {attachment && (
              <div className="space-y-3 rounded-md bg-raised p-3 hairline">
                {preview.isLoading && <div className="h-48 animate-pulse rounded-sm bg-surface" />}
                {preview.blob && <AttachmentImage blob={preview.blob} alt={attachment.fileName} className="max-h-80 w-full rounded-sm object-contain" />}
                {preview.isError && <p className="text-[13px] text-danger">{t("obra.diario.details.attachmentError")}</p>}
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-[560] text-ink">{attachment.fileName}</p>
                    <p className="text-[12px] text-meta">{attachment.fileType}</p>
                  </div>
                  <Button variant="outline" size="sm" fullWidth={false} onClick={() => void handleDownload(attachment)}>
                    <Download size={15} />
                    {t("obra.diario.details.download")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
