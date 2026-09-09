import { describe, expect, it } from "vitest"

import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  DOCUMENT_ACCEPT_ATTRIBUTE,
  DOCUMENT_MIME_TYPES,
  IMAGE_ACCEPT_ATTRIBUTE,
  IMAGE_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_MB,
  isAllowedAttachmentMime,
  isDocumentMime,
  isImageMime,
} from "./attachments"

/**
 * O limite e a lista de tipos aparecem em três lugares: no `accept` do input,
 * na validação antes do upload e na mensagem de erro. Testar aqui é o que
 * garante que os três falem do mesmo conjunto — um `accept` mais largo que a
 * validação vira erro só depois de o usuário escolher o arquivo.
 */

describe("limite de tamanho", () => {
  it("mantém bytes e MB coerentes entre si", () => {
    expect(MAX_ATTACHMENT_SIZE_BYTES).toBe(MAX_ATTACHMENT_SIZE_MB * 1024 * 1024)
  })
})

describe("isImageMime", () => {
  it("aceita os formatos de imagem da lista", () => {
    for (const mime of IMAGE_MIME_TYPES) {
      expect(isImageMime(mime), mime).toBe(true)
    }
  })

  it("rejeita documento e tipo desconhecido", () => {
    expect(isImageMime("application/pdf")).toBe(false)
    expect(isImageMime("image/svg+xml")).toBe(false)
    expect(isImageMime("")).toBe(false)
  })
})

describe("isDocumentMime", () => {
  it("aceita PDF e DOCX", () => {
    for (const mime of DOCUMENT_MIME_TYPES) {
      expect(isDocumentMime(mime), mime).toBe(true)
    }
  })

  it("rejeita imagem e formatos legados do Office", () => {
    expect(isDocumentMime("image/png")).toBe(false)
    expect(isDocumentMime("application/msword")).toBe(false)
  })
})

describe("isAllowedAttachmentMime", () => {
  it("aceita tudo que está nas duas listas", () => {
    for (const mime of ALLOWED_ATTACHMENT_MIME_TYPES) {
      expect(isAllowedAttachmentMime(mime), mime).toBe(true)
    }
  })

  // Executável disfarçado é o caso que a lista existe para barrar.
  it("rejeita tipo fora das listas", () => {
    expect(isAllowedAttachmentMime("application/x-msdownload")).toBe(false)
    expect(isAllowedAttachmentMime("text/html")).toBe(false)
  })

  it("é exatamente a união de imagens e documentos", () => {
    expect([...ALLOWED_ATTACHMENT_MIME_TYPES]).toEqual([
      ...IMAGE_MIME_TYPES,
      ...DOCUMENT_MIME_TYPES,
    ])
  })
})

describe("atributos accept", () => {
  it("lista as imagens separadas por vírgula", () => {
    expect(IMAGE_ACCEPT_ATTRIBUTE.split(",")).toEqual([...IMAGE_MIME_TYPES])
  })

  // As extensões entram junto do MIME porque o Windows nem sempre resolve o
  // tipo do arquivo no diálogo — sem `.pdf`/`.docx` o arquivo fica cinza.
  it("acrescenta as extensões aos documentos", () => {
    expect(DOCUMENT_ACCEPT_ATTRIBUTE).toContain(".pdf")
    expect(DOCUMENT_ACCEPT_ATTRIBUTE).toContain(".docx")
    for (const mime of DOCUMENT_MIME_TYPES) {
      expect(DOCUMENT_ACCEPT_ATTRIBUTE).toContain(mime)
    }
  })
})
