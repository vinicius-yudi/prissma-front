import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { WorkspaceRole } from "@/shared/types/workspace"

import { AuthProvider, useAuth } from "../AuthContext"

vi.mock("@/shared/services/user.service", () => ({
  getMyProfile: vi.fn(),
}))

const perfil = vi.mocked(getMyProfile)

/** JWT de mentira com os claims de workspace, em base64url como o real. */
function tokenCom(claims: Record<string, unknown>): string {
  const payload = btoa(JSON.stringify(claims))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `cabecalho.${payload}.assinatura`
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    )
  }

  return { Wrapper, queryClient }
}

function renderAuth() {
  const { Wrapper, queryClient } = makeWrapper()
  const view = renderHook(() => useAuth(), { wrapper: Wrapper })
  return { ...view, queryClient }
}

const USUARIO = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

beforeEach(() => {
  vi.resetAllMocks()
  perfil.mockResolvedValue(USUARIO)
})

describe("sessão", () => {
  it("nasce deslogado quando não há token guardado", () => {
    const { result } = renderAuth()

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
  })

  // O token é lido do localStorage no primeiro render (lazy initializer), não
  // num efeito: um F5 não pode passar por um quadro "deslogado" e disparar o
  // guard de rota para o login.
  it("recupera a sessão do localStorage já no primeiro render", () => {
    localStorage.setItem("token", "jwt-guardado")

    const { result } = renderAuth()

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.token).toBe("jwt-guardado")
  })

  it("não busca o perfil sem token", () => {
    renderAuth()

    expect(perfil).not.toHaveBeenCalled()
  })

  it("busca o perfil quando há token", async () => {
    localStorage.setItem("token", "jwt-guardado")

    const { result } = renderAuth()

    await waitFor(() => expect(result.current.user).toEqual(USUARIO))
  })
})

describe("saveToken", () => {
  it("grava no storage e autentica", async () => {
    const { result } = renderAuth()

    await act(async () => result.current.saveToken("jwt-novo"))

    expect(localStorage.getItem("token")).toBe("jwt-novo")
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("passa a buscar o perfil depois do login", async () => {
    const { result } = renderAuth()

    await act(async () => result.current.saveToken("jwt-novo"))

    await waitFor(() => expect(result.current.user).toEqual(USUARIO))
  })
})

describe("logout", () => {
  it("apaga o token e derruba a sessão", async () => {
    localStorage.setItem("token", "jwt-guardado")
    const { result } = renderAuth()

    await act(async () => result.current.logout())

    expect(localStorage.getItem("token")).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  // Sem limpar o cache, o próximo login herdaria o perfil e as listas do
  // usuário anterior — inclusive obras de outra conta.
  it("limpa o cache de queries", async () => {
    localStorage.setItem("token", "jwt-guardado")
    const { result, queryClient } = renderAuth()
    const clear = vi.spyOn(queryClient, "clear")

    await act(async () => result.current.logout())

    expect(clear).toHaveBeenCalledTimes(1)
  })
})

describe("workspace ativo", () => {
  // O workspace ativo É o claim do token, não estado paralelo: assim o header
  // X-Workspace-Id e a sessão nunca divergem, nem entre abas.
  it("é decodificado do próprio token", () => {
    localStorage.setItem(
      "token",
      tokenCom({ workspaceId: 42, workspaceRole: WorkspaceRole.ADMIN, isOwner: true }),
    )

    const { result } = renderAuth()

    expect(result.current.activeWorkspace).toEqual({
      workspaceId: 42,
      workspaceRole: WorkspaceRole.ADMIN,
      isOwner: true,
    })
  })

  it("é null para token sem os claims", () => {
    localStorage.setItem("token", "jwt-antigo")

    const { result } = renderAuth()

    expect(result.current.activeWorkspace).toBeNull()
  })

  it("acompanha a troca de conta quando um token novo é gravado", async () => {
    localStorage.setItem("token", tokenCom({ workspaceId: 1 }))
    const { result } = renderAuth()
    expect(result.current.activeWorkspace?.workspaceId).toBe(1)

    await act(async () => result.current.saveToken(tokenCom({ workspaceId: 2 })))

    expect(result.current.activeWorkspace?.workspaceId).toBe(2)
  })
})

describe("isLoadingUser", () => {
  // Sem token não há o que carregar: deixar `true` faria o shell mostrar
  // esqueleto para sempre na tela de login.
  it("é false quando não há sessão", () => {
    const { result } = renderAuth()

    expect(result.current.isLoadingUser).toBe(false)
  })

  it("é true enquanto o perfil não chega e false depois", async () => {
    localStorage.setItem("token", "jwt-guardado")
    let resolver: (u: typeof USUARIO) => void = () => {}
    perfil.mockReturnValue(new Promise((resolve) => (resolver = resolve)))

    const { result } = renderAuth()
    await waitFor(() => expect(result.current.isLoadingUser).toBe(true))

    await act(async () => resolver(USUARIO))

    await waitFor(() => expect(result.current.isLoadingUser).toBe(false))
  })
})

describe("useAuth fora do provider", () => {
  it("lança erro explicando o que falta", () => {
    const erroSilenciado = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth deve ser usado dentro de <AuthProvider>",
    )

    erroSilenciado.mockRestore()
  })
})
