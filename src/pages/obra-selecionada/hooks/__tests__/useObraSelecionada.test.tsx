import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getProject } from "@/pages/projetos/services/projects.service"
import { ProjectStatus } from "@/shared/types/project"
import { createHookWrapper } from "@/test/renderWithProviders"

import { useCategoryExpenses } from "../useCategoryExpenses"
import { useObraSelecionada } from "../useObraSelecionada"
import { listExpenses } from "../../services/budget.service"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  getProject: vi.fn(),
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))
vi.mock("../../services/budget.service", () => ({
  listExpenses: vi.fn(),
  getProjectBudget: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  createBudgetItem: vi.fn(),
  updateBudgetItem: vi.fn(),
  deleteBudgetItem: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}))

const buscarObra = vi.mocked(getProject)
const listarDespesas = vi.mocked(listExpenses)

const OBRA = {
  id: 7,
  title: "Residencial Alfa",
  status: ProjectStatus.IN_PROGRESS,
}

beforeEach(() => {
  vi.resetAllMocks()
  buscarObra.mockResolvedValue(OBRA as never)
  listarDespesas.mockResolvedValue([])
})

describe("useObraSelecionada", () => {
  // A rota entrega o id como texto: `Number("abc")` vira NaN e `/projects/NaN`
  // seria um 400 garantido.
  it("não consulta com id inválido", () => {
    renderHook(() => useObraSelecionada(0), { wrapper: createHookWrapper() })

    expect(buscarObra).not.toHaveBeenCalled()
  })

  it("busca a obra pelo id", async () => {
    const { result } = renderHook(() => useObraSelecionada(7), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.projectQuery.data).toBeTruthy())
    expect(buscarObra).toHaveBeenCalledWith(7)
  })

  it("expõe o erro da consulta para a tela decidir o que mostrar", async () => {
    buscarObra.mockRejectedValue(new Error("Obra não encontrada."))

    const { result } = renderHook(() => useObraSelecionada(7), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.projectQuery.isError).toBe(true))
  })
})

/**
 * As despesas de uma categoria só carregam quando o acordeão dela abre — são
 * N categorias na tela, e buscar todas de uma vez seria N requisições que
 * ninguém pediu.
 */
describe("useCategoryExpenses", () => {
  it("não busca com o acordeão fechado", () => {
    renderHook(() => useCategoryExpenses(3, false), { wrapper: createHookWrapper() })

    expect(listarDespesas).not.toHaveBeenCalled()
  })

  it("busca as despesas da categoria quando abre", async () => {
    renderHook(() => useCategoryExpenses(3, true), { wrapper: createHookWrapper() })

    await waitFor(() => expect(listarDespesas).toHaveBeenCalledWith(3))
  })

  it("devolve lista vazia enquanto carrega", () => {
    const { result } = renderHook(() => useCategoryExpenses(3, true), {
      wrapper: createHookWrapper(),
    })

    expect(result.current.expenses).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })
})
