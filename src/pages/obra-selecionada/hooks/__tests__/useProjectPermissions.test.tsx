import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import { createHookWrapper } from "@/test/renderWithProviders"

import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import { useObraMembers } from "../useObraMembers"
import { useProjectPermissions } from "../useProjectPermissions"
import { useRolePermissions } from "../useRolePermissions"

vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({ getEquipeMembers: vi.fn() }))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))

const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function membro(userId: number, papel: RoleInProject): ConstructionProjectMember {
  return {
    id: userId * 10,
    constructionProjectId: 7,
    user: { id: userId, name: "Alguém", email: "x@y.com", role: GlobalRole.ENG },
    roleInProject: papel,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  } as ConstructionProjectMember
}

beforeEach(() => {
  vi.resetAllMocks()
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([])
  permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
})

describe("useObraMembers", () => {
  it("não busca com id de obra inválido", () => {
    renderHook(() => useObraMembers(0), { wrapper: createHookWrapper() })

    expect(membros).not.toHaveBeenCalled()
  })

  it("não busca quando a tela desliga a consulta", () => {
    renderHook(() => useObraMembers(7, { enabled: false }), { wrapper: createHookWrapper() })

    expect(membros).not.toHaveBeenCalled()
  })

  it("busca os membros da obra", async () => {
    membros.mockResolvedValue([membro(1, RoleInProject.ENGINEER)])

    const { result } = renderHook(() => useObraMembers(7), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.count).toBe(1))
    expect(membros).toHaveBeenCalledWith(7)
  })

  // `list` existe para quem só renderiza: enquanto `members` é undefined no
  // carregamento, `list` já é um array — o `.map()` do componente não quebra.
  it("expõe uma lista sempre iterável", () => {
    const { result } = renderHook(() => useObraMembers(7), { wrapper: createHookWrapper() })

    expect(result.current.members).toBeUndefined()
    expect(result.current.list).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it("sinaliza erro da consulta", async () => {
    membros.mockRejectedValue(new Error("Erro 500"))

    const { result } = renderHook(() => useObraMembers(7), { wrapper: createHookWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useRolePermissions", () => {
  // Membro sem papel gerenciável (cliente) resolve `role` como null; consultar
  // `/roles/null/permissions` renderia 404 a cada entrada na obra.
  it("não consulta sem papel", () => {
    renderHook(() => useRolePermissions(7, null), { wrapper: createHookWrapper() })

    expect(permissoes).not.toHaveBeenCalled()
  })

  it("não consulta com obra inválida", () => {
    renderHook(() => useRolePermissions(0, ProjectRole.ENGINEER), {
      wrapper: createHookWrapper(),
    })

    expect(permissoes).not.toHaveBeenCalled()
  })

  it("devolve as permissões do papel", async () => {
    permissoes.mockResolvedValue({
      role: ProjectRole.ENGINEER,
      permissions: [ProjectPermission.MANAGE_TASKS],
    })

    const { result } = renderHook(() => useRolePermissions(7, ProjectRole.ENGINEER), {
      wrapper: createHookWrapper(),
    })

    await waitFor(() =>
      expect(result.current.permissions).toEqual([ProjectPermission.MANAGE_TASKS]),
    )
    expect(permissoes).toHaveBeenCalledWith(7, ProjectRole.ENGINEER)
  })

  it("devolve lista vazia enquanto carrega", () => {
    const { result } = renderHook(() => useRolePermissions(7, ProjectRole.ENGINEER), {
      wrapper: createHookWrapper(),
    })

    expect(result.current.permissions).toEqual([])
  })
})

describe("useProjectPermissions", () => {
  it("resolve o papel do usuário na obra", async () => {
    membros.mockResolvedValue([membro(1, RoleInProject.FOREMAN), membro(2, RoleInProject.OWNER)])

    const { result } = renderHook(() => useProjectPermissions(7), {
      wrapper: createHookWrapper(),
    })

    await waitFor(() => expect(result.current.roleInProject).toBe(RoleInProject.FOREMAN))
  })

  it("devolve papel nulo para quem não é membro", async () => {
    membros.mockResolvedValue([membro(2, RoleInProject.OWNER)])

    const { result } = renderHook(() => useProjectPermissions(7), {
      wrapper: createHookWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.roleInProject).toBeNull()
  })

  // ADMIN global passa por cima do vínculo: sem isso um admin que não é membro
  // veria "Acesso negado" em todos os módulos da obra — o oposto do que o
  // papel significa no backend.
  it("dá tudo ao ADMIN global sem consultar permissões de papel", async () => {
    perfil.mockResolvedValue({ ...EU, role: GlobalRole.ADMIN })
    membros.mockResolvedValue([])

    const { result } = renderHook(() => useProjectPermissions(7), {
      wrapper: createHookWrapper(),
    })

    await waitFor(() => expect(result.current.isAdmin).toBe(true))
    expect(result.current.can(ProjectPermission.MANAGE_BUDGET)).toBe(true)
    expect(permissoes).not.toHaveBeenCalled()
  })

  it("permite o que o papel permite e nega o resto", async () => {
    membros.mockResolvedValue([membro(1, RoleInProject.ENGINEER)])
    permissoes.mockResolvedValue({
      role: ProjectRole.ENGINEER,
      permissions: [ProjectPermission.MANAGE_TASKS],
    })

    const { result } = renderHook(() => useProjectPermissions(7), {
      wrapper: createHookWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.can(ProjectPermission.MANAGE_TASKS)).toBe(true)
    expect(result.current.can(ProjectPermission.MANAGE_BUDGET)).toBe(false)
  })

  // Fail-open enquanto carrega para a barra de ações não piscar. O gate real é
  // o backend, que recusa com 403 mesmo se o botão aparecer.
  it("libera enquanto ainda está carregando", () => {
    const { result } = renderHook(() => useProjectPermissions(7), {
      wrapper: createHookWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.can(ProjectPermission.MANAGE_BUDGET)).toBe(true)
  })

  // Cliente da obra não tem papel gerenciável: a query desliga, `isLoading`
  // cai para false e as permissões ficam vazias. É o que impede o fail-open de
  // virar permissão permanente para quem não deveria ter nenhuma.
  it("não deixa o cliente preso no fail-open", async () => {
    membros.mockResolvedValue([membro(1, RoleInProject.USER)])

    const { result } = renderHook(() => useProjectPermissions(7), {
      wrapper: createHookWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.can(ProjectPermission.MANAGE_BUDGET)).toBe(false)
    expect(permissoes).not.toHaveBeenCalled()
  })
})
