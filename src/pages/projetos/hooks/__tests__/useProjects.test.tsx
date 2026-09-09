import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { createHookWrapper } from "@/test/renderWithProviders"

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from "../../services/projects.service"
import { ProjectFilter } from "../../types"
import { useCreateProject } from "../useCreateProject"
import { useDeleteProject } from "../useDeleteProject"
import { useEditProject } from "../useEditProject"
import { useProjects } from "../useProjects"

vi.mock("../../services/projects.service", () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(listProjects)

/**
 * A busca chega pela URL: quem escreve é o <HeaderSearch>, que vive acima
 * desta página, e quem lê é o hook. Esta rota inicial é o que simula os dois
 * lados do contrato.
 */
function renderProjects(rota = "/obras") {
  return renderHook(() => useProjects(), { wrapper: createHookWrapper(rota) })
}

let proximoId = 1

function obra(over: Partial<Project> = {}): Project {
  return {
    id: proximoId++,
    title: "Residencial Aurora",
    address: "Avenida Paulista, 1000",
    street: "Avenida Paulista",
    number: "1000",
    complement: null,
    neighborhood: "Bela Vista",
    city: "São Paulo",
    state: "SP",
    zipCode: "01310100",
    projectType: "RESIDENCIAL",
    category: "NOVA",
    landArea: 300,
    builtArea: 180,
    status: ProjectStatus.IN_PROGRESS,
    plannedStartDate: "2026-01-01",
    plannedEndDate: "2027-01-01",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
})

describe("useProjects — listagem", () => {
  it("devolve lista vazia enquanto carrega", () => {
    const { result } = renderProjects()

    expect(result.current.projects).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("devolve as obras da conta", async () => {
    listar.mockResolvedValue([obra({ title: "Aurora" })])

    const { result } = renderProjects()

    await waitFor(() => expect(result.current.projects).toHaveLength(1))
  })

  it("sinaliza erro da consulta", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    const { result } = renderProjects()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useProjects — estatísticas", () => {
  it("conta total, em andamento e concluídas", async () => {
    listar.mockResolvedValue([
      obra({ status: ProjectStatus.IN_PROGRESS }),
      obra({ status: ProjectStatus.IN_PROGRESS }),
      obra({ status: ProjectStatus.COMPLETED }),
      obra({ status: ProjectStatus.PLANNING }),
    ])

    const { result } = renderProjects()

    await waitFor(() => expect(result.current.stats.total).toBe(4))
    expect(result.current.stats).toMatchObject({ inProgress: 2, completed: 1 })
  })

  it("conta como atrasada a obra cujo prazo passou", async () => {
    listar.mockResolvedValue([obra({ plannedEndDate: "2020-01-01" })])

    const { result } = renderProjects()

    await waitFor(() => expect(result.current.stats.overdue).toBe(1))
  })

  // Obra entregue com prazo estourado é concluída, não atrasada — o mesmo
  // princípio do badge de status.
  it("não conta atraso em obra concluída ou cancelada", async () => {
    listar.mockResolvedValue([
      obra({ plannedEndDate: "2020-01-01", status: ProjectStatus.COMPLETED }),
      obra({ plannedEndDate: "2020-01-01", status: ProjectStatus.CANCELLED }),
    ])

    const { result } = renderProjects()

    await waitFor(() => expect(result.current.stats.total).toBe(2))
    expect(result.current.stats.overdue).toBe(0)
  })

  it("não conta atraso em obra sem prazo definido", async () => {
    listar.mockResolvedValue([obra({ plannedEndDate: null })])

    const { result } = renderProjects()

    await waitFor(() => expect(result.current.stats.total).toBe(1))
    expect(result.current.stats.overdue).toBe(0)
  })

  // As estatísticas são do conjunto INTEIRO: elas continuam contando todas as
  // obras mesmo com um filtro ativo, senão os cartões do topo mudariam a cada
  // clique e deixariam de servir como panorama.
  it("ignora o filtro ativo", async () => {
    listar.mockResolvedValue([
      obra({ status: ProjectStatus.IN_PROGRESS }),
      obra({ status: ProjectStatus.COMPLETED }),
    ])
    const { result } = renderProjects()
    await waitFor(() => expect(result.current.stats.total).toBe(2))

    act(() => result.current.setFilter(ProjectFilter.COMPLETED))

    expect(result.current.projects).toHaveLength(1)
    expect(result.current.stats.total).toBe(2)
  })
})

describe("useProjects — filtro", () => {
  beforeEach(() => {
    listar.mockResolvedValue([
      obra({ title: "Em andamento", status: ProjectStatus.IN_PROGRESS }),
      obra({ title: "Concluída", status: ProjectStatus.COMPLETED }),
      obra({ title: "Atrasada", plannedEndDate: "2020-01-01" }),
    ])
  })

  it("começa mostrando tudo", async () => {
    const { result } = renderProjects()

    await waitFor(() => expect(result.current.projects).toHaveLength(3))
    expect(result.current.filter).toBe(ProjectFilter.ALL)
  })

  it("filtra por status", async () => {
    const { result } = renderProjects()
    await waitFor(() => expect(result.current.projects).toHaveLength(3))

    act(() => result.current.setFilter(ProjectFilter.COMPLETED))
    expect(result.current.projects.map((p) => p.title)).toEqual(["Concluída"])
  })

  it("filtra por atraso", async () => {
    const { result } = renderProjects()
    await waitFor(() => expect(result.current.projects).toHaveLength(3))

    act(() => result.current.setFilter(ProjectFilter.OVERDUE))
    expect(result.current.projects.map((p) => p.title)).toEqual(["Atrasada"])
  })
})

describe("useProjects — busca pela URL", () => {
  beforeEach(() => {
    listar.mockResolvedValue([
      obra({ title: "Residencial Aurora", address: "Avenida Paulista, 1000" }),
      obra({ title: "Edifício Boreal", address: "Rua das Palmeiras, 45" }),
    ])
  })

  it("filtra pelo título", async () => {
    const { result } = renderProjects("/obras?q=aurora")

    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    expect(result.current.projects[0].title).toBe("Residencial Aurora")
  })

  // O usuário procura pela obra do jeito que ele a conhece — às vezes pela rua.
  it("filtra também pelo endereço", async () => {
    const { result } = renderProjects("/obras?q=palmeiras")

    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    expect(result.current.projects[0].title).toBe("Edifício Boreal")
  })

  it("ignora maiúsculas e minúsculas", async () => {
    const { result } = renderProjects("/obras?q=AURORA")

    await waitFor(() => expect(result.current.projects).toHaveLength(1))
  })

  it("trata busca só com espaços como busca vazia", async () => {
    const { result } = renderProjects("/obras?q=%20%20")

    await waitFor(() => expect(result.current.projects).toHaveLength(2))
  })

  it("combina busca e filtro", async () => {
    listar.mockResolvedValue([
      obra({ title: "Aurora I", status: ProjectStatus.COMPLETED }),
      obra({ title: "Aurora II", status: ProjectStatus.IN_PROGRESS }),
    ])
    const { result } = renderProjects("/obras?q=aurora")
    await waitFor(() => expect(result.current.projects).toHaveLength(2))

    act(() => result.current.setFilter(ProjectFilter.COMPLETED))

    expect(result.current.projects.map((p) => p.title)).toEqual(["Aurora I"])
  })

  it("expõe o termo buscado para a tela mostrar 'nada encontrado'", async () => {
    const { result } = renderProjects("/obras?q=inexistente")

    await waitFor(() => expect(result.current.projects).toHaveLength(0))
    expect(result.current.search).toBe("inexistente")
  })
})

/**
 * As três mutations seguem o mesmo desenho: invalidam o cache de obras, dão o
 * toast e chamam o `onSuccess` da tela (que fecha o modal). Esquecer a
 * invalidação é o erro clássico — a obra é criada e a lista continua velha até
 * o próximo F5.
 */
describe("mutations de obra", () => {
  it("cria, invalida a lista, avisa e fecha o modal", async () => {
    vi.mocked(createProject).mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateProject({ onSuccess }), {
      wrapper: createHookWrapper(),
    })

    act(() => result.current.handleCreate({ title: "Aurora" } as never))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Obra criada com sucesso!"))
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it("edita passando id e payload separados", async () => {
    vi.mocked(updateProject).mockResolvedValue({} as never)
    const { result } = renderHook(() => useEditProject(), { wrapper: createHookWrapper() })

    act(() => result.current.handleEdit(7, { title: "Aurora II" }))

    await waitFor(() => expect(updateProject).toHaveBeenCalled())
    expect(vi.mocked(updateProject).mock.calls[0].slice(0, 2)).toEqual([7, { title: "Aurora II" }])
  })

  it("exclui e avisa", async () => {
    vi.mocked(deleteProject).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteProject(), { wrapper: createHookWrapper() })

    act(() => result.current.handleDelete(7))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Obra excluída com sucesso!"))
    expect(vi.mocked(deleteProject).mock.calls[0][0]).toBe(7)
  })

  it("mostra a mensagem do backend quando a exclusão falha", async () => {
    vi.mocked(deleteProject).mockRejectedValue(new Error("Obra tem etapas vinculadas."))
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteProject({ onSuccess }), {
      wrapper: createHookWrapper(),
    })

    act(() => result.current.handleDelete(7))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Obra tem etapas vinculadas."))
    // O modal continua aberto: fechá-lo daria a impressão de que deu certo.
    expect(onSuccess).not.toHaveBeenCalled()
  })

  // Erro sem mensagem (falha de rede, por exemplo) não pode virar toast vazio.
  it("cai numa mensagem própria quando o erro não tem texto", async () => {
    vi.mocked(createProject).mockRejectedValue(new Error(""))
    const { result } = renderHook(() => useCreateProject(), { wrapper: createHookWrapper() })

    act(() => result.current.handleCreate({} as never))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao criar obra"))
  })
})
