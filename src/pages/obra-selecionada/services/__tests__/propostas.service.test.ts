import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import {
  ProposalRequestError,
  addProposalVersion,
  changeVersionStatus,
  createProposal,
  deleteProposal,
  fetchVersionImage,
  getPreview,
  getProposal,
  listProposals,
  requestPreview,
  updateProposal,
} from "../propostas.service"
import type { PreviewOptions } from "../../types/proposal"

/**
 * Quatro rotas saem do `api.*` porque trafegam binário: criação, nova versão,
 * disparo da prévia e download da imagem. O que este teste protege é o que se
 * perde ao sair do caminho comum — os headers de auth/tenant, o 401 e o erro
 * em `text/plain` que o backend devolve.
 */
vi.mock("@/lib/api", async () => {
  const buildHeaders = vi.fn(() => ({ Authorization: "Bearer jwt", "X-Workspace-Id": "3" }))
  return {
    buildHeaders,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }
})

const get = vi.mocked(api.get)
const patch = vi.mocked(api.patch)
const del = vi.mocked(api.delete)
const fetchMock = vi.fn()

const locationOriginal = window.location

const OPCOES: PreviewOptions = {
  environment: "LIVING_ROOM",
  style: "MODERN",
  colors: ["OFF_WHITE", "NATURAL_WOOD"],
  lighting: "WARM_INDIRECT",
  flooring: "LIGHT_PORCELAIN",
  generationMode: "PREVIEW",
}

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
  const fake = { href: "http://localhost/obras/7/propostas" }
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: fake })
  return fake
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function imagem(nome = "sala.png"): File {
  return new File(["binario"], nome, { type: "image/png" })
}

function corpo(): FormData {
  return fetchMock.mock.calls[0][1].body as FormData
}

/**
 * Lê uma parte do FormData como texto.
 *
 * `Blob.text()` não existe no jsdom 26, então o caminho é o FileReader — que
 * existe. Vale para qualquer parte montada por `jsonPart`.
 */
function lerParte(parte: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(parte)
  })
}

describe("rotas JSON", () => {
  it("lista, lê, atualiza e exclui pelo cliente comum", async () => {
    get.mockResolvedValue({ content: [] })
    patch.mockResolvedValue({ id: 1 })
    del.mockResolvedValue(undefined)

    await listProposals(7)
    await getProposal(7, 3)
    await updateProposal(7, 3, { title: "Sala", environmentType: "LIVING_ROOM" })
    await deleteProposal(7, 3)
    await getPreview(7, 3, 9)

    expect(get).toHaveBeenCalledWith("/projects/7/proposals")
    expect(get).toHaveBeenCalledWith("/projects/7/proposals/3")
    expect(get).toHaveBeenCalledWith("/projects/7/proposals/3/previews/9")
    expect(patch).toHaveBeenCalledWith("/projects/7/proposals/3", {
      title: "Sala",
      environmentType: "LIVING_ROOM",
    })
    expect(del).toHaveBeenCalledWith("/projects/7/proposals/3")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("manda status e comentário juntos ao aprovar uma versão", async () => {
    patch.mockResolvedValue({ id: 5 })

    await changeVersionStatus(7, 3, 5, "APPROVED", "ficou bom")

    expect(patch).toHaveBeenCalledWith("/projects/7/proposals/3/versions/5/status", {
      status: "APPROVED",
      comment: "ficou bom",
    })
  })
})

describe("criação em multipart", () => {
  it("manda a proposta como parte JSON de verdade", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))

    await createProposal(7, { title: "Sala", environmentType: "LIVING_ROOM" })

    const parte = corpo().get("proposal") as Blob
    // `FormData.append(nome, JSON.stringify(x))` manda text/plain e o
    // @RequestPart do Spring responde 415 — o tipo do Blob é o que evita isso.
    expect(parte.type).toBe("application/json")
    expect(JSON.parse(await lerParte(parte))).toEqual({
      title: "Sala",
      environmentType: "LIVING_ROOM",
    })
  })

  it("omite o arquivo quando a proposta nasce sem imagem", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))

    await createProposal(7, { title: "Sala", environmentType: "LIVING_ROOM" }, null)

    expect(corpo().get("file")).toBeNull()
  })

  it("leva os headers de auth e de workspace", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))

    await createProposal(7, { title: "Sala", environmentType: "LIVING_ROOM" }, imagem())

    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: "Bearer jwt",
      "X-Workspace-Id": "3",
    })
    expect(corpo().get("file")).toBeInstanceOf(File)
  })

  it("passa a descrição da nova versão pela query", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 2 }))

    await addProposalVersion(7, 3, imagem(), "ajuste do sofá")

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/projects/7/proposals/3/versions?description=ajuste%20do%20sof%C3%A1",
    )
  })
})

describe("disparo da prévia", () => {
  it("manda foto, planta e opções como partes distintas", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 9, status: "PROCESSING" }, 202))

    const job = await requestPreview(7, 3, imagem("foto.png"), imagem("planta.png"), OPCOES)

    const body = corpo()
    expect(body.get("rawImage")).toBeInstanceOf(File)
    expect(body.get("floorPlan")).toBeInstanceOf(File)
    const opcoes = body.get("options") as Blob
    expect(opcoes.type).toBe("application/json")
    expect(JSON.parse(await lerParte(opcoes))).toEqual(OPCOES)
    expect(job.status).toBe("PROCESSING")
  })

  it("não manda a parte da planta quando ela não foi enviada", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 9, status: "PROCESSING" }, 202))

    await requestPreview(7, 3, imagem(), null, OPCOES)

    expect(corpo().get("floorPlan")).toBeNull()
  })
})

describe("imagem da versão", () => {
  it("devolve o blob com os headers de auth", async () => {
    fetchMock.mockResolvedValue(new Response(new Blob(["png"])))

    const blob = await fetchVersionImage(7, 3, 5)

    expect(fetchMock).toHaveBeenCalledWith("/api/projects/7/proposals/3/versions/5/image", {
      headers: { Authorization: "Bearer jwt", "X-Workspace-Id": "3" },
    })
    // Sem `toBeInstanceOf`: o Blob volta do realm do fetch, não do jsdom.
    expect(blob.size).toBeGreaterThan(0)
  })
})

describe("erros", () => {
  it("usa o texto cru como mensagem — o backend responde text/plain", async () => {
    fetchMock.mockResolvedValue(
      new Response("Já existe uma proposta com esse nome.", {
        status: 409,
        headers: { "content-type": "text/plain" },
      }),
    )

    await expect(
      createProposal(7, { title: "Sala", environmentType: "LIVING_ROOM" }),
    ).rejects.toMatchObject({
      status: 409,
      message: "Já existe uma proposta com esse nome.",
    })
  })

  it("prefere o campo message quando a falha vem em JSON (@Valid)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "O título é obrigatório" }, 400))

    await expect(
      createProposal(7, { title: "", environmentType: "LIVING_ROOM" }),
    ).rejects.toMatchObject({ status: 400, message: "O título é obrigatório" })
  })

  it("cai para o status quando o corpo vem vazio", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }))

    await expect(fetchVersionImage(7, 3, 5)).rejects.toMatchObject({ message: "Erro 500" })
  })

  it("derruba a sessão no 401 e manda para o login", async () => {
    const location = stubLocation()
    localStorage.setItem("token", "jwt")
    fetchMock.mockResolvedValue(new Response("", { status: 401 }))

    await expect(fetchVersionImage(7, 3, 5)).rejects.toBeInstanceOf(ProposalRequestError)

    expect(localStorage.getItem("token")).toBeNull()
    expect(location.href).toBe("/login")
  })
})
