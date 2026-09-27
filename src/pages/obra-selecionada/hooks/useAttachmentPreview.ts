import { useQuery } from "@tanstack/react-query"

import type { Attachment } from "@/shared/types/attachment"

import { downloadAttachment } from "../services/attachments.service"

interface AttachmentPreview {
  /** Conteúdo da imagem; `null` enquanto carrega, em erro ou se não for imagem. */
  blob: Blob | null
  isLoading: boolean
  isError: boolean
}

function isImage(attachment: Attachment | null): attachment is Attachment {
  return !!attachment && attachment.fileType.toLowerCase().startsWith("image/")
}

/**
 * Prévia de um anexo de imagem do diário.
 *
 * Baixar o arquivo é leitura de dados, então é `useQuery` (CLAUDE.md §3) —
 * antes era um `useEffect` com três `useState` de carregando/erro/URL. O
 * cache devolve a imagem na hora quando o mesmo registro é reaberto. A URL
 * `blob:` não mora aqui: nasce e morre com o `<img>` (<AttachmentImage>).
 */
export function useAttachmentPreview(projectId: number, attachment: Attachment | null): AttachmentPreview {
  const enabled = isImage(attachment)
  const query = useQuery({
    queryKey: ["attachment-preview", projectId, attachment?.id],
    queryFn: () => downloadAttachment(projectId, attachment?.id ?? 0),
    enabled,
    staleTime: Infinity,
  })

  return {
    blob: enabled ? (query.data ?? null) : null,
    isLoading: enabled && query.isLoading,
    isError: enabled && query.isError,
  }
}
