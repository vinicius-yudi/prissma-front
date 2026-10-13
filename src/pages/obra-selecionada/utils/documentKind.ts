import { isDocumentMime, isImageMime } from "@/shared/constants/attachments"
import type { Attachment } from "@/shared/types/attachment"

export const DOC_KIND = {
  PDF: "pdf",
  DOC: "doc",
  IMAGE: "img",
} as const

export type DocKind = (typeof DOC_KIND)[keyof typeof DOC_KIND]

/** Ordem do filtro: plantas e contratos antes das fotos. */
export const DOC_KINDS: DocKind[] = [DOC_KIND.PDF, DOC_KIND.DOC, DOC_KIND.IMAGE]

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

/** Tipo pelo MIME, com a extensão de reserva (o navegador às vezes manda vazio). */
export function kindOf(file: Pick<Attachment, "fileName" | "fileType">): DocKind {
  const mime = file.fileType.toLowerCase()
  const ext = file.fileName.split(".").pop()?.toLowerCase() ?? ""
  if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tif", "tiff"].includes(ext)) return DOC_KIND.IMAGE
  if (mime === DOCX_MIME || ext === "docx") return DOC_KIND.DOC
  return DOC_KIND.PDF
}

/** O que o backend aceita guardar: imagem, PDF e DOCX. */
export function isAcceptedFile(file: Pick<File, "type" | "name">): boolean {
  if (isImageMime(file.type) || isDocumentMime(file.type)) return true
  // Sem MIME (alguns navegadores com .docx), a extensão decide.
  return !file.type && /\.(pdf|docx)$/i.test(file.name)
}
