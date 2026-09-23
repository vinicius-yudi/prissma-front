import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import { createDiarioEntry, deleteDiarioEntry, getDiarioEntries } from "../diario.service"

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const del = vi.mocked(api.delete)

beforeEach(() => {
  vi.resetAllMocks()
})

describe("diario service", () => {
  // A paginação vai na query string, e os defaults ficam AQUI e não no
  // chamador: a primeira página do diário é a tela inicial do módulo, e cada
  // componente escolhendo o próprio `size` faria a rolagem pular registros.
  it("usa página 0 e 20 itens por padrão", async () => {
    get.mockResolvedValue([])

    await getDiarioEntries(7)

    expect(get).toHaveBeenCalledWith("/projects/7/diary-entries?page=0&size=20")
  })

  it("respeita a página e o tamanho pedidos", async () => {
    get.mockResolvedValue([])

    await getDiarioEntries(7, 3, 50)

    expect(get).toHaveBeenCalledWith("/projects/7/diary-entries?page=3&size=50")
  })

  it("cria um registro na obra", async () => {
    post.mockResolvedValue({ id: 1 })
    const payload = { entryDate: "2026-03-15", description: "Concretagem da laje" }

    await createDiarioEntry(7, payload as Parameters<typeof createDiarioEntry>[1])

    expect(post).toHaveBeenCalledWith("/projects/7/diary-entries", payload)
  })

  it("exclui um registro pela obra e pelo id", async () => {
    del.mockResolvedValue(undefined)

    await deleteDiarioEntry(7, 42)

    expect(del).toHaveBeenCalledWith("/projects/7/diary-entries/42")
  })

  // O backend responde ora com página, ora com array cru dependendo da versão.
  // O service repassa os dois sem normalizar — quem normaliza é o hook.
  it("repassa tanto a página quanto o array cru", async () => {
    get.mockResolvedValueOnce({ content: [{ id: 1 }], totalPages: 2 })
    await expect(getDiarioEntries(7)).resolves.toMatchObject({ totalPages: 2 })

    get.mockResolvedValueOnce([{ id: 1 }])
    await expect(getDiarioEntries(7)).resolves.toEqual([{ id: 1 }])
  })
})
