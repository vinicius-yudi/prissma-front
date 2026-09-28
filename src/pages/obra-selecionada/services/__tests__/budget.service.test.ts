import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import {
  createBudget,
  createBudgetItem,
  createExpense,
  deleteBudget,
  deleteBudgetItem,
  deleteExpense,
  getProjectBudget,
  listExpenses,
  updateBudget,
  updateBudgetItem,
  updateExpense,
} from "../budget.service"

/**
 * Quase tudo aqui é `api.*`, mas `getProjectBudget` faz `fetch` cru — ela
 * precisa distinguir "obra sem orçamento" (404 → null) de erro de verdade, e
 * o `request()` do api.ts trata todo não-2xx como exceção. Por isso o teste
 * mocka as duas coisas: o cliente e o `fetch`.
 */
vi.mock("@/lib/api", async () => {
  const buildHeaders = vi.fn(() => ({ Authorization: "Bearer jwt", "X-Workspace-Id": "3" }))
  return {
    buildHeaders,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  }
})

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const patch = vi.mocked(api.patch)
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
  const fake = { href: "http://localhost/obras/7/orcamento" }
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: fake })
  return fake
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

describe("getProjectBudget", () => {
  it("devolve o orçamento da obra", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 5, plannedTotal: 1000 }))

    await expect(getProjectBudget(7)).resolves.toEqual({ id: 5, plannedTotal: 1000 })
    expect(fetchMock).toHaveBeenCalledWith("/api/projects/7/budget", {
      headers: { Authorization: "Bearer jwt", "X-Workspace-Id": "3" },
    })
  })

  // Este é o motivo de o `fetch` ser cru aqui: obra ainda sem orçamento é
  // estado normal, e a tela mostra o vazio convidando a criar. Tratar como
  // erro encheria o módulo de toast vermelho no uso comum.
  it("devolve null quando a obra ainda não tem orçamento", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 404 }))

    await expect(getProjectBudget(7)).resolves.toBeNull()
  })

  it("limpa a sessão e redireciona no 401", async () => {
    localStorage.setItem("token", "expirado")
    const location = stubLocation()
    fetchMock.mockResolvedValue(new Response("", { status: 401 }))

    await expect(getProjectBudget(7)).rejects.toThrow("Sessão expirada. Faça login novamente.")
    expect(localStorage.getItem("token")).toBeNull()
    expect(location.href).toBe("/login")
  })

  it("usa a mensagem do corpo JSON no erro", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "Sem permissão." }, 403))

    await expect(getProjectBudget(7)).rejects.toThrow("Sem permissão.")
  })

  it("usa o corpo cru quando o erro não é JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Gateway indisponível", { status: 502 }))

    await expect(getProjectBudget(7)).rejects.toThrow("Gateway indisponível")
  })

  it("cai no status quando o corpo do erro vem vazio", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }))

    await expect(getProjectBudget(7)).rejects.toThrow("Erro 500")
  })
})

describe("orçamento", () => {
  it("cria dentro da obra e edita pela rota do orçamento", async () => {
    post.mockResolvedValue({ id: 5 })
    patch.mockResolvedValue({ id: 5 })
    del.mockResolvedValue(undefined)
    const payload = { description: "Obra completa", plannedTotal: 250000 }

    await createBudget(7, payload)
    await updateBudget(5, payload)
    await deleteBudget(5)

    expect(post).toHaveBeenCalledWith("/projects/7/budget", payload)
    expect(patch).toHaveBeenCalledWith("/budgets/5", payload)
    expect(del).toHaveBeenCalledWith("/budgets/5")
  })
})

describe("itens do orçamento", () => {
  it("cria dentro do orçamento e edita pela rota do item", async () => {
    post.mockResolvedValue({ id: 9 })
    patch.mockResolvedValue({ id: 9 })
    del.mockResolvedValue(undefined)
    const payload = { category: "Materiais", description: "Cimento", plannedAmount: 4800 }

    await createBudgetItem(5, payload)
    await updateBudgetItem(9, payload)
    await deleteBudgetItem(9)

    expect(post).toHaveBeenCalledWith("/budgets/5/items", payload)
    expect(patch).toHaveBeenCalledWith("/budget-items/9", payload)
    expect(del).toHaveBeenCalledWith("/budget-items/9")
  })
})

describe("despesas", () => {
  const payload = {
    description: "Areia média",
    amount: 320.5,
    spentAt: "2026-03-15",
    stageId: null,
    supplier: null,
    receiptUrl: null,
  }

  it("lista e cria dentro do item", async () => {
    get.mockResolvedValue([])
    post.mockResolvedValue({ id: 20 })

    await listExpenses(9)
    await createExpense(9, payload)

    expect(get).toHaveBeenCalledWith("/budget-items/9/expenses")
    expect(post).toHaveBeenCalledWith("/budget-items/9/expenses", payload)
  })

  // Uma vez criada, a despesa tem rota própria: usar o id do item aqui
  // editaria o lançamento errado.
  it("edita e exclui pela rota da própria despesa", async () => {
    patch.mockResolvedValue({ id: 20 })
    del.mockResolvedValue(undefined)

    await updateExpense(20, payload)
    await deleteExpense(20)

    expect(patch).toHaveBeenCalledWith("/expenses/20", payload)
    expect(del).toHaveBeenCalledWith("/expenses/20")
  })
})
