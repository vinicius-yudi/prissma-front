import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { listProjects } from "@/pages/projetos/services/projects.service"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { createHookWrapper } from "@/test/renderWithProviders"

import { STATIC_STATS } from "../../constants"
import { useDashboard } from "../useDashboard"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))

const listar = vi.mocked(listProjects)

function obra(id: number, status: ProjectStatus): Project {
  return { id, title: `Obra ${id}`, status } as Project
}

function render() {
  return renderHook(() => useDashboard(), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
})

describe("useDashboard", () => {
  it("começa vazio e carregando", () => {
    const { result } = render()

    expect(result.current.activeCount).toBe(0)
    expect(result.current.inProgressProjects).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("conta todas as obras visíveis ao usuário", async () => {
    listar.mockResolvedValue([
      obra(1, ProjectStatus.IN_PROGRESS),
      obra(2, ProjectStatus.COMPLETED),
    ])

    const { result } = render()

    await waitFor(() => expect(result.current.activeCount).toBe(2))
  })

  // A lista da Home é só das obras tocando: concluída e pausada não aparecem.
  it("lista apenas as obras em andamento", async () => {
    listar.mockResolvedValue([
      obra(1, ProjectStatus.IN_PROGRESS),
      obra(2, ProjectStatus.COMPLETED),
      obra(3, ProjectStatus.PLANNING),
    ])

    const { result } = render()

    await waitFor(() => expect(result.current.inProgressProjects).toHaveLength(1))
    expect(result.current.inProgressProjects[0].id).toBe(1)
  })
})

/**
 * Os dois cards da Home são **valores fixos** — não há endpoint por trás. O
 * teste existe para que, no dia em que houver, a mudança seja deliberada e
 * não uma constante esquecida.
 */
describe("STATIC_STATS", () => {
  it("mantém os dois cards fixos com chave de tradução e tom", () => {
    expect(STATIC_STATS).toHaveLength(2)
    for (const card of STATIC_STATS) {
      expect(card.labelKey).toMatch(/^dashboard\.stats\./)
      expect(card.detailKey).toMatch(/^dashboard\.stats\./)
      expect(["ok", "warn"]).toContain(card.tone)
    }
  })
})
