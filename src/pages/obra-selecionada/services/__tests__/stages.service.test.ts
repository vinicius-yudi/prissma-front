import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { EtapaStatus } from "@/pages/projetos/types"

import {
  createStage,
  deleteStage,
  getStage,
  listStages,
  reorderStages,
  updateStage,
  type StageRequest,
} from "../stages.service"
import {
  createTarefa,
  deleteTarefa,
  getTarefa,
  getTarefas,
  updateTarefa,
} from "../tarefas.service"

/**
 * Etapa e tarefa vivem em rotas aninhadas diferentes (`/projects/:id/stages` e
 * `/stages/:id/tasks`), e várias operações usam o id do FILHO, não do pai —
 * `updateStage` recebe stageId, não projectId. Confundir os dois devolve 404
 * ou, pior, escreve na obra errada.
 */
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const patch = vi.mocked(api.patch)
const del = vi.mocked(api.delete)

beforeEach(() => {
  vi.resetAllMocks()
})

const payloadEtapa: StageRequest = {
  name: "Fundação",
  description: "Sapatas e baldrames",
  displayOrder: 1,
  status: EtapaStatus.PLANNED,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-03-20",
}

describe("stages service", () => {
  it("lista as etapas de uma obra", async () => {
    get.mockResolvedValue([])

    await listStages(7)

    expect(get).toHaveBeenCalledWith("/projects/7/stages")
  })

  // A partir daqui a etapa é endereçada por id próprio, fora da obra.
  it("busca uma etapa pelo id dela", async () => {
    get.mockResolvedValue({ id: 3 })

    await getStage(3)

    expect(get).toHaveBeenCalledWith("/stages/3")
  })

  it("cria a etapa dentro da obra", async () => {
    post.mockResolvedValue({ id: 3 })

    await createStage(7, payloadEtapa)

    expect(post).toHaveBeenCalledWith("/projects/7/stages", payloadEtapa)
  })

  it("edita e exclui pela rota da própria etapa", async () => {
    patch.mockResolvedValue({ id: 3 })
    del.mockResolvedValue(undefined)

    await updateStage(3, payloadEtapa)
    await deleteStage(3)

    expect(patch).toHaveBeenCalledWith("/stages/3", payloadEtapa)
    expect(del).toHaveBeenCalledWith("/stages/3")
  })

  // O reordenar manda um ARRAY cru, não um objeto: é o contrato do backend,
  // e embrulhar em `{ stages: [...] }` faria a request passar sem efeito.
  it("reordena mandando a lista de ids como corpo", async () => {
    post.mockResolvedValue({ message: "ok", stages: [] })

    await reorderStages(7, [3, 1, 2])

    expect(post).toHaveBeenCalledWith("/projects/7/stages/reorder", [3, 1, 2])
  })
})

describe("tarefas service", () => {
  it("lista as tarefas de uma etapa", async () => {
    get.mockResolvedValue([])

    await getTarefas(3)

    expect(get).toHaveBeenCalledWith("/stages/3/tasks")
  })

  // A tarefa NÃO tem rota própria: ela é sempre endereçada dentro da etapa.
  it("endereça a tarefa sempre por etapa + tarefa", async () => {
    get.mockResolvedValue({ id: 11 })
    patch.mockResolvedValue({ id: 11 })
    del.mockResolvedValue(undefined)

    await getTarefa(3, 11)
    await updateTarefa(3, 11, { title: "Concretar laje" })
    await deleteTarefa(3, 11)

    expect(get).toHaveBeenCalledWith("/stages/3/tasks/11")
    expect(patch).toHaveBeenCalledWith("/stages/3/tasks/11", { title: "Concretar laje" })
    expect(del).toHaveBeenCalledWith("/stages/3/tasks/11")
  })

  it("cria a tarefa na etapa", async () => {
    post.mockResolvedValue({ id: 11 })
    const data = {
      title: "Concretar laje",
      description: "Primeiro pavimento",
      priority: "HIGH",
      status: "TODO",
      plannedStartDate: "2026-03-01",
      plannedEndDate: "2026-03-05",
      assigneeUserId: 12,
    } as Parameters<typeof createTarefa>[1]

    await createTarefa(3, data)

    expect(post).toHaveBeenCalledWith("/stages/3/tasks", data)
  })
})
