export const MAX_ATTACHMENT_SIZE_BYTES = 52428800
export const MAX_ATTACHMENT_SIZE_MB = 50

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/webp",
] as const

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
] as const

export const IMAGE_ACCEPT_ATTRIBUTE = IMAGE_MIME_TYPES.join(",")
export const DOCUMENT_ACCEPT_ATTRIBUTE = [
  ...DOCUMENT_MIME_TYPES,
  ".pdf",
  ".docx",
].join(",")

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number]
export type DocumentMimeType = (typeof DOCUMENT_MIME_TYPES)[number]
export type AttachmentMimeType = (typeof ALLOWED_ATTACHMENT_MIME_TYPES)[number]

export function isImageMime(mime: string): mime is ImageMimeType {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime)
}

export function isDocumentMime(mime: string): mime is DocumentMimeType {
  return (DOCUMENT_MIME_TYPES as readonly string[]).includes(mime)
}

export function isAllowedAttachmentMime(mime: string): mime is AttachmentMimeType {
  return (ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[]).includes(mime)
}
