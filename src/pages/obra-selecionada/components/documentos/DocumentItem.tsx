import { Download, Loader2, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import type { Attachment } from "@/shared/types/attachment"
import { formatDate } from "@/shared/utils/formatters"

import { kindOf } from "../../utils/documentKind"
import { FileSheet } from "./FileSheet"

const action = tv({
  base: "flex size-9 cursor-pointer items-center justify-center rounded-[9px] text-ink-3 disabled:cursor-default",
  variants: {
    danger: { true: "hover:bg-danger-soft hover:text-danger", false: "hover:bg-surface hover:text-ink" },
  },
  defaultVariants: { danger: false },
})

interface DocumentItemProps {
  attachment: Attachment
  stageName: string | null
  uploaderName: string | null
  isDownloading: boolean
  canDelete: boolean
  onDownload: (attachment: Attachment) => void
  onDelete: (attachment: Attachment) => void
}

/** Um arquivo: folha do tipo, nome, data, etapa, quem enviou e as ações. */
export function DocumentItem({ attachment, stageName, uploaderName, isDownloading, canDelete, onDownload, onDelete }: DocumentItemProps) {
  const { t } = useTranslation()
  const meta = [formatDate(attachment.uploadedAt), stageName].filter(Boolean).join(" · ")

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="group flex list-none items-center gap-4 px-4 py-3 transition-colors hover:bg-raised sm:px-5"
    >
      <FileSheet kind={kindOf(attachment)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-[580] text-ink">{attachment.fileName}</p>
        <p className="t-num mt-0.5 truncate text-[12.5px] text-meta">{meta}</p>
      </div>
      {uploaderName && (
        <span className="hidden items-center gap-2 text-[12.5px] text-ink-2 md:flex">
          <Avatar name={uploaderName} size={22} />
          {uploaderName.split(" ")[0]}
        </span>
      )}
      <div className="flex transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onDownload(attachment)}
          disabled={isDownloading}
          aria-label={t("obra.documentos.downloadFile", { name: attachment.fileName })}
          className={action()}
        >
          {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        </button>
        {canDelete && (
          <button type="button" onClick={() => onDelete(attachment)} aria-label={t("obra.documentos.deleteFile", { name: attachment.fileName })} className={action({ danger: true })}>
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </motion.li>
  )
}
