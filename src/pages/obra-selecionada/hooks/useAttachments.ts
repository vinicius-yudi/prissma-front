import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { MAX_ATTACHMENT_SIZE_MB } from "@/shared/constants/attachments"

import {
  AttachmentRequestError,
  listAttachments,
  uploadAttachment,
} from "../services/attachments.service"

interface AttachmentLabels {
  uploadSuccess: string
  uploadError: string
  deleteSuccess: string
  deleteError: string
}

interface UseAttachmentsOptions {
  labels: AttachmentLabels
}

/** Chaves de i18n dos toasts — foto e documento falam diferente. */
export const FOTO_LABELS: AttachmentLabels = {
  uploadSuccess: "obra.attachments.toasts.photoUploaded",
  uploadError: "obra.attachments.toasts.photoUploadError",
  deleteSuccess: "obra.attachments.toasts.photoDeleted",
  deleteError: "obra.attachments.toasts.photoDeleteError",
}

export const DOCUMENTO_LABELS: AttachmentLabels = {
  uploadSuccess: "obra.attachments.toasts.documentUploaded",
  uploadError: "obra.attachments.toasts.documentUploadError",
  deleteSuccess: "obra.attachments.toasts.documentDeleted",
  deleteError: "obra.attachments.toasts.documentDeleteError",
}

export interface UploadInput {
  file: File
  /** Vincula o anexo a uma etapa. */
  stageId?: number | null
}

export function useAttachments(projectId: number, options: UseAttachmentsOptions = { labels: FOTO_LABELS }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const queryKey = ["attachments", projectId]
  const { labels } = options

  const query = useQuery({
    queryKey,
    queryFn: () => listAttachments(projectId),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, stageId }: UploadInput) => uploadAttachment(projectId, file, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(t(labels.uploadSuccess))
    },
    onError: (error: Error) => {
      if (error instanceof AttachmentRequestError) {
        if (error.status === 413) {
          toast.error(t("obra.attachments.fileTooLarge", { max: MAX_ATTACHMENT_SIZE_MB }))
          return
        }
        if (error.status === 415) {
          toast.error(t("obra.attachments.mimeMismatch"))
          return
        }
      }
      toast.error(error.message || t(labels.uploadError))
    },
  })

  return {
    attachments: query.data ?? [],
    isLoading: query.isLoading,
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
  }
}
