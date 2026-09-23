import { useQuery } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { createHookWrapper } from "@/test/renderWithProviders"

import { deleteAccount } from "../../services/perfil.service"
import { useDeleteAccount } from "../useDeleteAccount"

const logout = vi.fn()

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ logout }) }))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/perfil.service", () => ({
  deleteAccount: vi.fn(),
  updateProfile: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const buscarPerfil = vi.mocked(getMyProfile)
const excluir = vi.mocked(deleteAccount)

const PERFIL = { id: 42, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

const onSuccess = vi.fn()

/**
 * O hook não expõe o perfil, mas depende dele (`profile!.id`): clicar em
 * excluir antes da consulta voltar estoura em `undefined`. Espiar a mesma
 * `queryKey` compartilha o cache e dá o sinal de "já carregou".
 */
function useHarness() {
  const espia = useQuery({ queryKey: ["profile"], queryFn: getMyProfile })
  return { ...useDeleteAccount({ onSuccess }), carregado: !!espia.data }
}

async function render() {
  const view = renderHook(useHarness, { wrapper: createHookWrapper() })
  await waitFor(() => expect(view.result.current.carregado).toBe(true))
  return view
}

beforeEach(() => {
  vi.resetAllMocks()
  buscarPerfil.mockResolvedValue(PERFIL)
  excluir.mockResolvedValue(undefined)
})

describe("useDeleteAccount", () => {
  it("exclui a conta do usuário logado", async () => {
    const { result } = await render()

    act(() => result.current.handleDelete())

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(42))
  })

  // A ordem importa: o modal precisa fechar antes do logout, que limpa o cache
  // do React Query e desmonta a árvore protegida.
  it("fecha o modal e derruba a sessão ao concluir", async () => {
    const { result } = await render()

    act(() => result.current.handleDelete())

    await waitFor(() => expect(logout).toHaveBeenCalled())
    expect(onSuccess).toHaveBeenCalled()
  })

  it("mostra o erro e mantém a sessão quando a exclusão falha", async () => {
    excluir.mockRejectedValue(new Error("Conta com obra ativa."))
    const { result } = await render()

    act(() => result.current.handleDelete())

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Conta com obra ativa."))
    expect(logout).not.toHaveBeenCalled()
  })
})
