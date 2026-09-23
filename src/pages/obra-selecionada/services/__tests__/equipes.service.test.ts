import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { getWorkspaceMembers } from "@/shared/services/workspace.service"
import { WorkspaceRole, type WorkspaceMember } from "@/shared/types/workspace"

import { RoleInProject } from "../../types/equipes"
import {
  addEquipeMember,
  getAvailableUsers,
  getEquipeMembers,
  removeEquipeMember,
} from "../equipes.service"
import { listProjectMembers } from "../projectMembers.service"
import {
  ALL_PROJECT_PERMISSIONS,
  EDITABLE_PROJECT_ROLES,
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
  updateRolePermissions,
} from "../projectPermissions.service"

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

vi.mock("@/shared/services/workspace.service", () => ({
  getWorkspaceMembers: vi.fn(),
}))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const put = vi.mocked(api.put)
const del = vi.mocked(api.delete)
const membrosDaConta = vi.mocked(getWorkspaceMembers)

beforeEach(() => {
  vi.resetAllMocks()
})

function membro(over: Partial<WorkspaceMember>): WorkspaceMember {
  return {
    id: 1,
    userId: 100,
    name: "Ana Souza",
    email: "ana@alfa.com",
    role: WorkspaceRole.MEMBER,
    active: true,
    acceptedAt: "2026-01-10T00:00:00Z",
    ...over,
  }
}

describe("equipe da obra", () => {
  it("lista, adiciona e remove pela rota de membros da obra", async () => {
    get.mockResolvedValue([])
    post.mockResolvedValue({})
    del.mockResolvedValue(undefined)

    await getEquipeMembers(7)
    await addEquipeMember(7, { userId: 100, roleInProject: RoleInProject.ENGINEER })
    await removeEquipeMember(7, 55)

    expect(get).toHaveBeenCalledWith("/projects/7/members")
    expect(post).toHaveBeenCalledWith("/projects/7/members", {
      userId: 100,
      roleInProject: RoleInProject.ENGINEER,
    })
    // Remover usa o id do VÍNCULO (member.id), não o do usuário.
    expect(del).toHaveBeenCalledWith("/projects/7/members/55")
  })
})

describe("getAvailableUsers", () => {
  it("busca os candidatos entre os membros da conta ativa", async () => {
    membrosDaConta.mockResolvedValue([membro({})])

    await getAvailableUsers()

    expect(membrosDaConta).toHaveBeenCalledTimes(1)
  })

  // OWNER e ADMIN já alcançam todas as obras do workspace: oferecê-los na
  // lista criaria vínculo redundante e confundiria a leitura da equipe.
  it("tira quem já manda na conta", async () => {
    membrosDaConta.mockResolvedValue([
      membro({ userId: 1, role: WorkspaceRole.OWNER }),
      membro({ userId: 2, role: WorkspaceRole.ADMIN }),
      membro({ userId: 3, role: WorkspaceRole.MEMBER }),
      membro({ userId: 4, role: WorkspaceRole.CLIENT }),
    ])

    const disponiveis = await getAvailableUsers()

    expect(disponiveis.map((u) => u.id)).toEqual([3, 4])
  })

  // Membro desativado continua no histórico da conta, mas não pode entrar em
  // obra nova.
  it("tira quem está desativado", async () => {
    membrosDaConta.mockResolvedValue([
      membro({ userId: 3, active: false }),
      membro({ userId: 4, active: true }),
    ])

    expect((await getAvailableUsers()).map((u) => u.id)).toEqual([4])
  })

  it("achata o membro no formato do seletor", async () => {
    membrosDaConta.mockResolvedValue([membro({ userId: 3 })])

    expect(await getAvailableUsers()).toEqual([
      { id: 3, name: "Ana Souza", email: "ana@alfa.com", role: WorkspaceRole.MEMBER },
    ])
  })

  // Convidado que ainda não aceitou não tem nome; mostrar o e-mail é melhor
  // que uma linha em branco no <Select>.
  it("cai no e-mail quando o convidado ainda não tem nome", async () => {
    membrosDaConta.mockResolvedValue([membro({ name: null })])

    expect((await getAvailableUsers())[0].name).toBe("ana@alfa.com")
  })

  it("não quebra quando falta nome e e-mail", async () => {
    membrosDaConta.mockResolvedValue([membro({ name: null, email: null })])

    expect((await getAvailableUsers())[0]).toMatchObject({ name: "", email: "" })
  })

  it("devolve lista vazia quando a conta não tem membros elegíveis", async () => {
    membrosDaConta.mockResolvedValue([])

    expect(await getAvailableUsers()).toEqual([])
  })
})

describe("membros do projeto", () => {
  it("usa a mesma rota da equipe", async () => {
    get.mockResolvedValue([])

    await listProjectMembers(7)

    expect(get).toHaveBeenCalledWith("/projects/7/members")
  })
})

describe("permissões por papel", () => {
  it("lê as permissões de um papel na obra", async () => {
    get.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    await getRolePermissions(7, ProjectRole.ENGINEER)

    expect(get).toHaveBeenCalledWith("/projects/7/roles/ENGINEER/permissions")
  })

  // PUT, não PATCH: a lista enviada SUBSTITUI a anterior. Com PATCH uma
  // permissão desmarcada continuaria valendo.
  it("substitui a lista inteira com PUT", async () => {
    put.mockResolvedValue({ role: ProjectRole.ARCHITECT, permissions: [] })

    await updateRolePermissions(7, ProjectRole.ARCHITECT, [ProjectPermission.VIEW_PROJECT])

    expect(put).toHaveBeenCalledWith("/projects/7/roles/ARCHITECT/permissions", {
      permissions: [ProjectPermission.VIEW_PROJECT],
    })
  })

  it("lista todas as permissões conhecidas sem repetir", () => {
    expect(new Set(ALL_PROJECT_PERMISSIONS).size).toBe(ALL_PROJECT_PERMISSIONS.length)
    expect([...ALL_PROJECT_PERMISSIONS].sort()).toEqual(Object.values(ProjectPermission).sort())
  })

  it("deixa os quatro papéis de obra editáveis", () => {
    expect([...EDITABLE_PROJECT_ROLES].sort()).toEqual(Object.values(ProjectRole).sort())
  })
})
