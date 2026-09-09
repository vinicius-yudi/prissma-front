import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useAuth } from "@/contexts/AuthContext"
import { useProjectPermissions } from "@/pages/obra-selecionada/hooks/useProjectPermissions"
import { RoleInProject } from "@/pages/obra-selecionada/types/equipes"
import { GlobalRole } from "@/shared/types/user"
import { WorkspaceRole } from "@/shared/types/workspace"

import { useAccess, useCurrentModule, useObraIdFromPath } from "../useAccess"

/**
 * Este hook é o único lugar que decide "qual perfil vale agora": dentro de uma
 * obra manda o vínculo com ela, fora manda o papel na conta. Sidebar, header e
 * guard de rota consultam ele — se cada um decidisse por conta própria, um
 * mostraria o módulo que o outro bloqueia.
 *
 * `useAuth` e `useProjectPermissions` são mockados porque ambos disparam rede;
 * o alvo aqui é a REGRA de resolução, não a busca.
 */
vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("@/pages/obra-selecionada/hooks/useProjectPermissions", () => ({
  useProjectPermissions: vi.fn(),
}))

const auth = vi.mocked(useAuth)
const permissoes = vi.mocked(useProjectPermissions)

type AuthOver = Partial<ReturnType<typeof useAuth>>

function comAuth(over: AuthOver = {}) {
  auth.mockReturnValue({
    token: "jwt",
    isAuthenticated: true,
    user: { id: 1, name: "Ana", email: "ana@alfa.com", role: GlobalRole.ENG },
    activeWorkspace: null,
    isLoadingUser: false,
    saveToken: vi.fn(),
    logout: vi.fn(),
    ...over,
  } as ReturnType<typeof useAuth>)
}

function comPapelNaObra(roleInProject: RoleInProject | null, over = {}) {
  permissoes.mockReturnValue({
    isAdmin: false,
    roleInProject,
    isLoading: false,
    can: () => true,
    ...over,
  })
}

function wrapperEm(rota: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[rota]}>{children}</MemoryRouter>
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  comAuth()
  comPapelNaObra(null)
})

describe("useObraIdFromPath", () => {
  it("lê o id da obra em qualquer profundidade da rota", () => {
    for (const rota of ["/obras/7", "/obras/7/", "/obras/7/etapas", "/obras/7/orcamento/itens"]) {
      const { result } = renderHook(() => useObraIdFromPath(), { wrapper: wrapperEm(rota) })
      expect(result.current, rota).toBe(7)
    }
  })

  it("devolve null fora de uma obra", () => {
    for (const rota of ["/dashboard", "/obras", "/pessoas"]) {
      const { result } = renderHook(() => useObraIdFromPath(), { wrapper: wrapperEm(rota) })
      expect(result.current, rota).toBeNull()
    }
  })

  // `/obras/nova` é a tela de cadastro, não uma obra: só dígito conta.
  it("não confunde segmento de texto com id", () => {
    const { result } = renderHook(() => useObraIdFromPath(), { wrapper: wrapperEm("/obras/nova") })

    expect(result.current).toBeNull()
  })
})

describe("useCurrentModule", () => {
  it("identifica o módulo dentro da obra", () => {
    const { result } = renderHook(() => useCurrentModule(), {
      wrapper: wrapperEm("/obras/7/orcamento"),
    })

    expect(result.current).toBe("orcamento")
  })

  it("identifica os módulos de nível 1", () => {
    expect(
      renderHook(() => useCurrentModule(), { wrapper: wrapperEm("/dashboard") }).result.current,
    ).toBe("home")
    expect(
      renderHook(() => useCurrentModule(), { wrapper: wrapperEm("/obras") }).result.current,
    ).toBe("obras")
  })

  it("devolve null para rota que não é módulo", () => {
    const { result } = renderHook(() => useCurrentModule(), { wrapper: wrapperEm("/perfil") })

    expect(result.current).toBeNull()
  })

  // Segmento desconhecido dentro da obra não pode virar módulo: o header
  // consultaria a matriz com uma chave inexistente.
  it("devolve null para segmento desconhecido dentro da obra", () => {
    const { result } = renderHook(() => useCurrentModule(), {
      wrapper: wrapperEm("/obras/7/inexistente"),
    })

    expect(result.current).toBeNull()
  })

  it("trata a raiz da obra como sem módulo", () => {
    const { result } = renderHook(() => useCurrentModule(), { wrapper: wrapperEm("/obras/7") })

    expect(result.current).toBeNull()
  })
})

describe("useAccess — nível 1 (fora de obra)", () => {
  it("usa o papel NA CONTA vindo do token", () => {
    comAuth({ activeWorkspace: { workspaceId: 1, workspaceRole: WorkspaceRole.CLIENT, isOwner: false } })

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/dashboard") })

    expect(result.current.profile).toBe("cliente")
  })

  // Token antigo do rollout não traz claims de workspace; o papel global
  // segura a barra até todo mundo trocar de token.
  it("cai no papel global quando o token não tem claims de conta", () => {
    comAuth({ activeWorkspace: null, user: { id: 1, name: "A", email: "a@b.c", role: GlobalRole.ARQ } })

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/dashboard") })

    expect(result.current.profile).toBe("arquiteto")
  })

  it("trata OWNER e ADMIN da conta como engenheiro", () => {
    for (const papel of [WorkspaceRole.OWNER, WorkspaceRole.ADMIN]) {
      comAuth({ activeWorkspace: { workspaceId: 1, workspaceRole: papel, isOwner: true } })
      const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/dashboard") })
      expect(result.current.profile, papel).toBe("engenheiro")
    }
  })

  // Módulo de obra consultado fora de uma obra não tem papel a consultar:
  // devolver "" evita que a sidebar de nível 1 liste itens da obra.
  it("nega módulo de obra quando não há obra aberta", () => {
    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/dashboard") })

    expect(result.current.levelOf("orcamento")).toBe("")
    expect(result.current.canSee("etapas")).toBe(false)
  })
})

describe("useAccess — nível 2 (dentro da obra)", () => {
  it("usa o vínculo com a obra, não o papel da conta", () => {
    comAuth({ activeWorkspace: { workspaceId: 1, workspaceRole: WorkspaceRole.MEMBER, isOwner: false } })
    comPapelNaObra(RoleInProject.ARCHITECT)

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/obras/7/etapas") })

    expect(result.current.profile).toBe("arquiteto")
    expect(result.current.obraId).toBe(7)
  })

  it("aplica a matriz ao perfil da obra", () => {
    comPapelNaObra(RoleInProject.USER)

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/obras/7") })

    expect(result.current.levelOf("orcamento")).toBe("r")
    expect(result.current.isReadOnly("orcamento")).toBe(true)
    expect(result.current.canSee("tarefas")).toBe(false)
  })

  it("dá acesso de engenheiro ao ADMIN global mesmo sem vínculo", () => {
    comPapelNaObra(null, { isAdmin: true })

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/obras/7") })

    expect(result.current.profile).toBe("engenheiro")
    expect(result.current.levelOf("orcamento")).toBe("w")
  })

  // Sem vínculo e sem ser admin, não há perfil: tudo negado, nem leitura.
  it("nega tudo para quem não tem vínculo com a obra", () => {
    comPapelNaObra(null)

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/obras/7") })

    expect(result.current.profile).toBeNull()
    expect(result.current.levelOf("visao-geral")).toBe("")
  })
})

describe("useAccess — carregamento", () => {
  it("carrega enquanto o perfil do usuário não chegou", () => {
    comAuth({ isLoadingUser: true })

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/dashboard") })

    expect(result.current.isLoading).toBe(true)
  })

  it("carrega enquanto o papel na obra não chegou", () => {
    comPapelNaObra(null, { isLoading: true })

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/obras/7") })

    expect(result.current.isLoading).toBe(true)
  })

  // Fora de uma obra o papel na obra não importa: esperar por ele deixaria o
  // dashboard em esqueleto sem motivo.
  it("não espera o papel de obra fora de uma obra", () => {
    comPapelNaObra(null, { isLoading: true })

    const { result } = renderHook(() => useAccess(), { wrapper: wrapperEm("/dashboard") })

    expect(result.current.isLoading).toBe(false)
  })
})
