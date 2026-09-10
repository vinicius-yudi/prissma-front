import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuth } from "@/contexts/AuthContext"
import {
  createWorkspace,
  getWorkspaces,
  switchWorkspace,
} from "@/shared/services/workspace.service"
import type { Workspace } from "@/shared/types/workspace"
import { createHookWrapper } from "@/test/renderWithProviders"

import { useWorkspaces } from "../useWorkspaces"

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("@/shared/services/workspace.service", () => ({
  getWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  switchWorkspace: vi.fn(),
}))

const auth = vi.mocked(useAuth)
const listar = vi.mocked(getWorkspaces)
const criar = vi.mocked(createWorkspace)
const trocar = vi.mocked(switchWorkspace)

const saveToken = vi.fn()
const reload = vi.fn()

const CONTA: Workspace = {
  id: 9,
  name: "Construtora Alfa",
  document: null,
  status: "ACTIVE",
  isPrimary: true,
  isOwner: true,
}

beforeEach(() => {
  vi.resetAllMocks()
  auth.mockReturnValue({ saveToken, isAuthenticated: true } as unknown as ReturnType<typeof useAuth>)
  listar.mockResolvedValue([CONTA])
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { ...window.location, reload },
  })
})

describe("listagem", () => {
  it("não busca as contas sem sessão", () => {
    auth.mockReturnValue({ saveToken, isAuthenticated: false } as unknown as ReturnType<typeof useAuth>)

    renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })

    expect(listar).not.toHaveBeenCalled()
  })

  it("lista as contas do usuário", async () => {
    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.workspaces).toEqual([CONTA]))
  })

  // O seletor de contas do sidebar itera o retorno direto: `undefined` durante
  // o carregamento quebraria o `.map()`.
  it("devolve lista vazia enquanto carrega", () => {
    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })

    expect(result.current.workspaces).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })
})

describe("troca de conta", () => {
  // O token novo carrega os claims do workspace alvo — é ele que passa a
  // mandar no X-Workspace-Id de toda request seguinte.
  it("grava o token novo devolvido pelo switch", async () => {
    trocar.mockResolvedValue({ token: "jwt-da-conta-9" })

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })
    act(() => result.current.switchTo(9))

    await waitFor(() => expect(saveToken).toHaveBeenCalledWith("jwt-da-conta-9"))
    // Só o primeiro argumento: o TanStack Query passa um contexto próprio
    // (client, meta, mutationKey) como segundo parâmetro da `mutationFn`.
    expect(trocar.mock.calls[0][0]).toBe(9)
  })

  // Recarregar é o jeito pragmático de invalidar TODO o cache de uma vez:
  // nenhum dado da conta anterior pode sobreviver à troca.
  it("recarrega a página depois de trocar", async () => {
    trocar.mockResolvedValue({ token: "jwt-da-conta-9" })

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })
    act(() => result.current.switchTo(9))

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
  })

  it("sinaliza a troca em andamento", async () => {
    trocar.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })
    act(() => result.current.switchTo(9))

    await waitFor(() => expect(result.current.isSwitching).toBe(true))
  })
})

describe("criação de conta", () => {
  // Conta nova já nasce ativa: criar e continuar na conta antiga deixaria o
  // usuário procurando onde a conta que ele acabou de criar foi parar.
  it("troca para a conta recém-criada", async () => {
    criar.mockResolvedValue(CONTA)
    trocar.mockResolvedValue({ token: "jwt-da-conta-9" })

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })
    act(() => result.current.create("Construtora Alfa"))

    await waitFor(() => expect(trocar).toHaveBeenCalled())
    expect(trocar.mock.calls[0][0]).toBe(9)
    expect(criar.mock.calls[0][0]).toBe("Construtora Alfa")
  })

  // A criação só termina de verdade quando a troca termina; sem incluir o
  // switch no "criando", o modal fecharia e piscaria a conta antiga.
  it("continua 'criando' enquanto a troca não termina", async () => {
    criar.mockResolvedValue(CONTA)
    trocar.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })
    act(() => result.current.create("Construtora Alfa"))

    await waitFor(() => expect(result.current.isCreating).toBe(true))
  })

  it("expõe o erro da criação para o formulário", async () => {
    criar.mockRejectedValue(new Error("Já existe uma conta com esse nome."))

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createHookWrapper() })
    act(() => result.current.create("Construtora Alfa"))

    await waitFor(() =>
      expect(result.current.createError).toEqual(new Error("Já existe uma conta com esse nome.")),
    )
  })
})
