import type { ChangeEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { ImageOff, Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { Attachment } from "@/shared/types/attachment"
import { Button } from "@/shared/components/ui/button/Button"
import { formatDate, stripExtension } from "@/shared/utils/formatters"

import { downloadAttachment } from "../services/attachments.service"
import { useAttachments } from "../hooks/useAttachments"

const PNG_TYPE = "image/png"

interface PhotoCardProps {
  attachment: Attachment
  projectId: number
  onRemove: (id: number) => void
}

function PhotoCard({ attachment, projectId, onRemove }: PhotoCardProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let url = ""
    let cancelled = false

    async function load() {
      try {
        const blob = await downloadAttachment(projectId, attachment.id)
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setBlobUrl(url)
      } catch {
        if (!cancelled) setHasError(true)
      }
    }

    load()

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [projectId, attachment.id])

  function handleRemove() {
    onRemove(attachment.id)
  }

  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden bg-surface-container">
      {blobUrl && (
        <img
          src={blobUrl}
          alt={attachment.fileName}
          className="w-full h-full object-cover"
        />
      )}
      {!blobUrl && !hasError && (
        <div className="w-full h-full animate-pulse bg-surface-container-highest" />
      )}
      {hasError && (
        <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
          <ImageOff size={32} />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
          <span className="text-white text-xs font-medium leading-tight truncate">{stripExtension(attachment.fileName)}</span>
          <span className="text-white/70 text-xs">{formatDate(attachment.uploadedAt)}</span>
        </div>
        <button
          onClick={handleRemove}
          className="p-1.5 bg-error rounded-lg text-white hover:brightness-90 transition-all shrink-0"
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function FotosEmpty() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center py-10 text-sm text-on-surface-variant">
      {t("obra.fotos.empty")}
    </div>
  )
}

interface FotosRecentesProps {
  projectId: number
}

export function FotosRecentes({ projectId }: FotosRecentesProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { attachments, isLoading, upload, isUploading, remove } = useAttachments(projectId)

  const photos = attachments.filter(a => a.fileType === PNG_TYPE)

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    upload(file)
    e.target.value = ""
  }

  if (isLoading) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6">
        <div className="h-4 w-32 bg-surface-container-highest rounded animate-pulse mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="aspect-square rounded-xl bg-surface-container-highest animate-pulse" />
          <div className="aspect-square rounded-xl bg-surface-container-highest animate-pulse" />
          <div className="aspect-square rounded-xl bg-surface-container-highest animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
          {t("obra.fotos.title")}
        </h2>
        <Button
          variant="outline"
          className="w-auto px-3 py-2 text-sm"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          <Plus size={14} />
          {isUploading ? t("obra.fotos.uploading") : t("obra.fotos.add")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {photos.length === 0 && <FotosEmpty />}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map(photo => (
            <PhotoCard
              key={photo.id}
              attachment={photo}
              projectId={projectId}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </div>
  )
}
