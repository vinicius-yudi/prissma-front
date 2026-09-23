import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { GlobalRole } from "@/shared/types/user"
import { WorkspaceRole } from "@/shared/types/workspace"
import { createHookWrapper } from "@/test/renderWithProviders"

import {
  addEquipeMember,
  getAvailableUsers,
  getEquipeMembers,
  removeEquipeMember,
} from "../../services/equipes.service"
import {
  RoleInProject,
  type AvailableUser,
  type ConstructionProjectMember,
} from "../../types/equipes"
import { useEquipes } from "../useEquipes"

vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listarMembros = vi.mocked(getEquipeMembers)
const adicionar = vi.mocked(addEquipeMember)
const remover = vi.mocked(removeEquipeMember)
const listarDisponiveis = vi.mocked(getAvailableUsers)

function membro(userId: number, nome = "Ana Souza"): ConstructionProjectMember {
  return {
    id: userId * 10,
    constructionProjectId: 7,
    user: { id: userId, name: nome, email: `${nome}@alfa.com`, role: GlobalRole.ENG },
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

function disponivel(id: number, name: string, role: WorkspaceRole): AvailableUser {
  return { id, name, email: `${id}@alfa.com`, role }
}

/** N colaboradores com nomes previsíveis, para exercitar a paginação de 5. */
function colaboradores(quantidade: number): AvailableUser[] {
  return Array.from({ length: quantidade }, (_, i) =>
    disponivel(i + 1, `Colaborador ${i + 1}`, WorkspaceRole.MEMBER),
  )
}

function render(obraId = 7, usersEnabled = true) {
  return renderHook(() => useEquipes(obraId, usersEnabled), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listarMembros.mockResolvedValue([])
  listarDisponiveis.mockResolvedValue([])
  adicionar.mockResolvedValue({
    id: 1,
    constructionProjectId: 7,
    user: { id: 2, name: "Bia", email: "bia@alfa.com", role: GlobalRole.ENG },
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  })
  remover.mockResolvedValue(undefined)
})

describe("useEquipes — consultas", () => {
  it("busca os membros da obra", async () => {
    listarMembros.mockResolvedValue([membro(1)])

    const { result } = render()

    await waitFor(() => expect(result.current.members).toHaveLength(1))
    expect(listarMembros).toHaveBeenCalledWith(7)
  })

  // /workspaces/members é vetado a CLIENT no backend: buscar sem o modal aberto
  // renderia 403 no console de quem só está olhando a lista.
  it("só busca os usuários disponíveis quando o chamador pede", () => {
    render(7, false)

    expect(listarDisponiveis).not.toHaveBeenCalled()
  })

  it("busca os disponíveis quando o modal abre", async () => {
    render(7, true)

    await waitFor(() => expect(listarDisponiveis).toHaveBeenCalled())
  })

  it("expõe o erro da consulta de membros", async () => {
    listarMembros.mockRejectedValue(new Error("Erro 500"))

    const { result } = render()

    await waitFor(() => expect(result.current.membersError).toBeTruthy())
  })
})

/**
 * A lista de disponíveis é o que sobra: tira quem já é da equipe, aplica a
 * busca por nome e separa cliente de colaborador — as duas seções do modal
 * pedem papéis diferentes na obra.
 */
describe("useEquipes — filtro dos disponíveis", () => {
  it("esconde quem já está na equipe", async () => {
    listarMembros.mockResolvedValue([membro(1)])
    listarDisponiveis.mockResolvedValue([
      disponivel(1, "Ana Souza", WorkspaceRole.MEMBER),
      disponivel(2, "Bia Lima", WorkspaceRole.MEMBER),
    ])

    const { result } = render()

    await waitFor(() => expect(result.current.filteredAvailableUsers.allCollaborators).toHaveLength(1))
    expect(result.current.filteredAvailableUsers.allCollaborators[0].id).toBe(2)
  })

  it("separa clientes de colaboradores", async () => {
    listarDisponiveis.mockResolvedValue([
      disponivel(1, "Ana Souza", WorkspaceRole.MEMBER),
      disponivel(2, "Construtora Beta", WorkspaceRole.CLIENT),
    ])

    const { result } = render()

    await waitFor(() => expect(result.current.filteredAvailableUsers.allClients).toHaveLength(1))
    expect(result.current.filteredAvailableUsers.allCollaborators).toHaveLength(1)
  })

  it("busca por nome sem diferenciar maiúsculas", async () => {
    listarDisponiveis.mockResolvedValue([
      disponivel(1, "Ana Souza", WorkspaceRole.MEMBER),
      disponivel(2, "Bia Lima", WorkspaceRole.MEMBER),
    ])
    const { result } = render()
    await waitFor(() => expect(result.current.filteredAvailableUsers.allCollaborators).toHaveLength(2))

    act(() => result.current.setSearchQuery("ANA"))

    expect(result.current.filteredAvailableUsers.allCollaborators).toHaveLength(1)
  })
})

describe("useEquipes — paginação", () => {
  it("mostra os cinco primeiros e sinaliza que há mais", async () => {
    listarDisponiveis.mockResolvedValue(colaboradores(8))

    const { result } = render()

    await waitFor(() => expect(result.current.filteredAvailableUsers.collaborators).toHaveLength(5))
    expect(result.current.collaboratorsHasMore).toBe(true)
  })

  it("carrega mais cinco e some com o botão ao chegar no fim", async () => {
    listarDisponiveis.mockResolvedValue(colaboradores(8))
    const { result } = render()
    await waitFor(() => expect(result.current.collaboratorsHasMore).toBe(true))

    act(() => result.current.loadMoreCollaborators())

    expect(result.current.filteredAvailableUsers.collaborators).toHaveLength(8)
    expect(result.current.collaboratorsHasMore).toBe(false)
  })

  it("pagina os clientes pelo mesmo passo", async () => {
    listarDisponiveis.mockResolvedValue(
      Array.from({ length: 7 }, (_, i) => disponivel(i + 1, `Cliente ${i + 1}`, WorkspaceRole.CLIENT)),
    )
    const { result } = render()
    await waitFor(() => expect(result.current.filteredAvailableUsers.clients).toHaveLength(5))

    act(() => result.current.loadMoreClients())

    expect(result.current.filteredAvailableUsers.clients).toHaveLength(7)
    expect(result.current.clientsHasMore).toBe(false)
  })

  // Sem o reset, digitar uma busca depois de "carregar mais" mostraria a lista
  // nova já expandida — e o botão sumiria sem o usuário ter clicado nele.
  it("volta a paginação ao início quando a busca muda", async () => {
    listarDisponiveis.mockResolvedValue(colaboradores(12))
    const { result } = render()
    await waitFor(() => expect(result.current.filteredAvailableUsers.collaborators).toHaveLength(5))
    act(() => result.current.loadMoreCollaborators())

    act(() => result.current.setSearchQuery("Colaborador"))

    expect(result.current.filteredAvailableUsers.collaborators).toHaveLength(5)
  })
})

describe("useEquipes — adicionar membro", () => {
  it("recusa quando ninguém foi selecionado", async () => {
    const { result } = render()

    act(() => result.current.handleAddMember())

    expect(toast.error).toHaveBeenCalledWith("Selecione um usuário")
    expect(adicionar).not.toHaveBeenCalled()
  })

  it("adiciona com o papel padrão da seleção", async () => {
    const { result } = render()
    act(() => result.current.setSelectedUserId(2))

    act(() => result.current.handleAddMember())

    await waitFor(() =>
      expect(adicionar).toHaveBeenCalledWith(7, {
        userId: 2,
        roleInProject: RoleInProject.ENGINEER,
      }),
    )
  })

  // A seção de clientes chama com o papel explícito: o padrão do estado é
  // ENGINEER e entraria errado se o argumento fosse ignorado.
  it("adiciona com o papel passado no clique", async () => {
    const { result } = render()
    act(() => result.current.setSelectedUserId(2))

    act(() => result.current.handleAddMember(RoleInProject.USER))

    await waitFor(() =>
      expect(adicionar).toHaveBeenCalledWith(7, { userId: 2, roleInProject: RoleInProject.USER }),
    )
  })

  it("usa o papel escolhido no seletor quando o clique não passa um", async () => {
    const { result } = render()
    act(() => result.current.setSelectedUserId(2))
    act(() => result.current.setSelectedRole(RoleInProject.FOREMAN))

    act(() => result.current.handleAddMember())

    await waitFor(() =>
      expect(adicionar).toHaveBeenCalledWith(7, { userId: 2, roleInProject: RoleInProject.FOREMAN }),
    )
  })

  it("limpa seleção e busca depois de adicionar", async () => {
    const { result } = render()
    act(() => result.current.setSelectedUserId(2))
    act(() => result.current.setSearchQuery("Ana"))

    act(() => result.current.handleAddMember())

    await waitFor(() => expect(result.current.selectedUserId).toBeNull())
    expect(result.current.searchQuery).toBe("")
  })

  it("mostra o erro do backend ao adicionar", async () => {
    adicionar.mockRejectedValue(new Error("Já é membro."))
    const { result } = render()
    act(() => result.current.setSelectedUserId(2))

    act(() => result.current.handleAddMember())

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Erro ao adicionar membro: Já é membro."),
    )
  })
})

describe("useEquipes — remover membro", () => {
  it("remove pelo id do vínculo, não do usuário", async () => {
    const { result } = render()

    act(() => result.current.handleRemoveMember(10))

    await waitFor(() => expect(remover).toHaveBeenCalledWith(7, 10))
    expect(toast.success).toHaveBeenCalled()
  })

  it("mostra o erro do backend ao remover", async () => {
    remover.mockRejectedValue(new Error("Membro é o dono."))
    const { result } = render()

    act(() => result.current.handleRemoveMember(10))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Erro ao remover membro: Membro é o dono."),
    )
  })
})
