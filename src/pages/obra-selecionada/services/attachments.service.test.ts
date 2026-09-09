import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import {
  AttachmentRequestError,
  deleteAttachment,
  downloadAttachment,
  listAttachments,
  triggerFileDownload,
  uploadAttachment,
} from "./attachments.service"

/**
 * Upload e download saem do `api.*` porque trafegam binário: um manda
 * `FormData` (e não pode ter `Content-Type` fixado à mão), o outro lê `Blob`.
 * O que este teste protege é justamente o que se perde ao sair do caminho
 * comum — os headers de auth/tenant e o tratamento de 401.
 */
vi.mock("@/lib/api", async () => {
  const buildHeaders = vi.fn(() => ({ Authorization: "Bearer jwt", "X-Workspace-Id": "3" }))
  return {
    buildHeaders,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }
})

const get = vi.mocked(api.get)
const del = vi.mocked(api.delete)
const fetchMock = vi.fn()

const locationOriginal = window.location

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: locationOriginal,
  })
})

function stubLocation(): { href: string } {
  const fake = { href: "http://localhost/obras/7/documentos" }
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: fake })
  return fake
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("rotas que passam pelo cliente comum", () => {
  it("lista e exclui pelo api", async () => {
    get.mockResolvedValue([])
    del.mockResolvedValue(undefined)

    await listAttachments(7)
    await deleteAttachment(7, 4)

    expect(get).toHaveBeenCalledWith("/projects/7/attachments")
    expect(del).toHaveBeenCalledWith("/projects/7/attachments/4")
  })
})

describe("uploadAttachment", () => {
  it("manda o arquivo como FormData com o alvo PROJECT", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 4, fileName: "planta.pdf" }))
    const file = new File(["conteudo"], "planta.pdf", { type: "application/pdf" })

    await expect(uploadAttachment(7, file)).resolves.toEqual({ id: 4, fileName: "planta.pdf" })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("/api/projects/7/attachments")
    expect(init.method).toBe("POST")
    const body = init.body as FormData
    expect(body.get("file")).toBe(file)
    expect(body.get("target")).toBe("PROJECT")
  })

  // Sem o `Content-Type` fixado à mão: o navegador precisa gerar o `boundary`
  // do multipart sozinho. Declará-lo aqui quebraria o parse no backend.
  it("manda os headers de auth sem forçar Content-Type", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 4 }))

    await uploadAttachment(7, new File([""], "a.pdf"))

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers).toEqual({ Authorization: "Bearer jwt", "X-Workspace-Id": "3" })
    expect(headers["Content-Type"]).toBeUndefined()
  })

  it("erra com status e mensagem do backend", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Arquivo acima de 50 MB." }, 413))

    await expect(uploadAttachment(7, new File([""], "a.pdf"))).rejects.toThrow(
      "Arquivo acima de 50 MB.",
    )
  })

  // O status vai junto no erro porque a tela reage diferente a 413 (tamanho) e
  // a 415 (tipo) — com `Error` puro ela só teria a string.
  it("expõe o status no erro", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Tipo não suportado." }, 415))

    await expect(uploadAttachment(7, new File([""], "a.exe"))).rejects.toMatchObject({
      name: "AttachmentRequestError",
      status: 415,
    })
  })

  it("usa o corpo cru quando o erro não é JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Gateway indisponível", { status: 502 }))

    await expect(uploadAttachment(7, new File([""], "a.pdf"))).rejects.toThrow(
      "Gateway indisponível",
    )
  })

  it("cai no status quando o corpo do erro vem vazio", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }))

    await expect(uploadAttachment(7, new File([""], "a.pdf"))).rejects.toThrow("Erro 500")
  })

  it("limpa a sessão e redireciona no 401", async () => {
    localStorage.setItem("token", "expirado")
    const location = stubLocation()
    fetchMock.mockResolvedValue(new Response("", { status: 401 }))

    await expect(uploadAttachment(7, new File([""], "a.pdf"))).rejects.toBeInstanceOf(
      AttachmentRequestError,
    )
    expect(localStorage.getItem("token")).toBeNull()
    expect(location.href).toBe("/login")
  })
})

describe("downloadAttachment", () => {
  it("devolve o blob do arquivo", async () => {
    fetchMock.mockResolvedValue(new Response("conteudo", { status: 200 }))

    const blob = await downloadAttachment(7, 4)

    expect(await blob.text()).toBe("conteudo")
    expect(fetchMock).toHaveBeenCalledWith("/api/projects/7/attachments/4/download", {
      headers: { Authorization: "Bearer jwt", "X-Workspace-Id": "3" },
    })
  })

  it("erra quando o arquivo não existe", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Anexo não encontrado." }, 404))

    await expect(downloadAttachment(7, 4)).rejects.toMatchObject({ status: 404 })
  })
})

describe("triggerFileDownload", () => {
  it("cria um link temporário, clica e devolve a URL do objeto", () => {
    const createObjectURL = vi.fn(() => "blob:temporaria")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})

    triggerFileDownload(new Blob(["x"]), "planta.pdf")

    expect(click).toHaveBeenCalledTimes(1)
    // Revogar é o que impede o blob de ficar preso na memória da aba enquanto
    // o usuário navega pelo módulo de documentos.
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:temporaria")
  })

  it("usa o nome informado como nome do arquivo baixado", () => {
    vi.stubGlobal("URL", { ...URL, createObjectURL: () => "blob:x", revokeObjectURL: vi.fn() })
    let baixado: HTMLAnchorElement | null = null
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      baixado = this
    })

    triggerFileDownload(new Blob(["x"]), "memorial descritivo.pdf")

    expect(baixado!.download).toBe("memorial descritivo.pdf")
  })
})
