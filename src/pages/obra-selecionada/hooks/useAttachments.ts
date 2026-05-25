import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { MAX_ATTACHMENT_SIZE_MB } from "@/shared/constants/attachments"

import {
  AttachmentRequestError,
  deleteAttachment,
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

export const FOTO_LABELS: AttachmentLabels = {
  uploadSuccess: "Foto adicionada com sucesso!",
  uploadError: "Erro ao enviar foto",
  deleteSuccess: "Foto removida com sucesso!",
  deleteError: "Erro ao remover foto",
}

export const DOCUMENTO_LABELS: AttachmentLabels = {
  uploadSuccess: "Documento adicionado com sucesso!",
  uploadError: "Erro ao enviar documento",
  deleteSuccess: "Documento removido com sucesso!",
  deleteError: "Erro ao remover documento",
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
    mutationFn: (file: File) => uploadAttachment(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(labels.uploadSuccess)
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
      toast.error(error.message || labels.uploadError)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteAttachment(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(labels.deleteSuccess)
    },
    onError: (error: Error) => {
      toast.error(error.message || labels.deleteError)
    },
  })

  return {
    attachments: query.data ?? [],
    isLoading: query.isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    remove: deleteMutation.mutate,
  }
}
