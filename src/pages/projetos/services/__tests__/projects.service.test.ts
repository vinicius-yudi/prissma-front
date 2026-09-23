import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import {
  createProject,
  deleteProject,
  getProject,
  getProjectAcompanhamento,
  listProjects,
  updateProject,
  type CreateProjectPayload,
} from "../projects.service"

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

const novaObra: CreateProjectPayload = {
  title: "Residencial Aurora",
  street: "Avenida Paulista",
  number: "1000",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  zipCode: "01310100",
  projectType: "RESIDENCIAL",
  category: "NOVA",
  status: "PLANNING",
  landArea: 300,
  builtArea: 180,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-12-01",
}

describe("projects service", () => {
  it("lista as obras da conta ativa", async () => {
    get.mockResolvedValue([{ id: 1 }])

    await expect(listProjects()).resolves.toEqual([{ id: 1 }])
    expect(get).toHaveBeenCalledWith("/projects")
  })

  it("busca uma obra pelo id", async () => {
    get.mockResolvedValue({ id: 7 })

    await getProject(7)

    expect(get).toHaveBeenCalledWith("/projects/7")
  })

  // O payload vai inteiro para o backend, sem remontagem: o `useCreateProject`
  // é quem traduz o formulário (logradouro/bairro) para os nomes daqui
  // (street/neighborhood). Se este service mexesse nos campos, seriam dois
  // lugares fazendo a mesma tradução.
  it("cria a obra repassando o payload sem transformar", async () => {
    post.mockResolvedValue(undefined)

    await createProject(novaObra)

    expect(post).toHaveBeenCalledWith("/projects", novaObra)
  })

  it("edita com PATCH parcial", async () => {
    patch.mockResolvedValue({ id: 7 })

    await updateProject(7, { title: "Residencial Aurora II" })

    expect(patch).toHaveBeenCalledWith("/projects/7", { title: "Residencial Aurora II" })
  })

  it("exclui a obra", async () => {
    del.mockResolvedValue(undefined)

    await deleteProject(7)

    expect(del).toHaveBeenCalledWith("/projects/7")
  })

  it("busca o acompanhamento em rota própria", async () => {
    get.mockResolvedValue({ stages: [] })

    await getProjectAcompanhamento(7)

    expect(get).toHaveBeenCalledWith("/projects/7/acompanhamento")
  })

  it("propaga o erro do cliente HTTP", async () => {
    get.mockRejectedValue(new Error("Erro 500"))

    await expect(listProjects()).rejects.toThrow("Erro 500")
  })
})
