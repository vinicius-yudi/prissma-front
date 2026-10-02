import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-toastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole, type Role } from "@/shared/types/user"
import { WorkspaceRole } from "@/shared/types/workspace"
import { renderWithProviders } from "@/test/renderWithProviders"
import { passarJanelaDoDesfazer, relogioDoDesfazer } from "@/test/undo"

import { addEquipeMember, getAvailableUsers, getEquipeMembers, removeEquipeMember, updateMemberRole } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
  updateRolePermissions,
  type ProjectPermission as Permission,
} from "../../services/projectPermissions.service"
import { RoleInProject, type AvailableUser, type ConstructionProjectMember } from "../../types/equipes"
import { EquipesTab } from "../EquipesTab"

vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
  updateMemberRole: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const listarMembros = vi.mocked(getEquipeMembers)
const adicionar = vi.mocked(addEquipeMember)
const remover = vi.mocked(removeEquipeMember)
const trocarPapel = vi.mocked(updateMemberRole)
const disponiveis = vi.mocked(getAvailableUsers)
const permissoes = vi.mocked(getRolePermissions)
const salvarPermissoes = vi.mocked(updateRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function membro(id: number, nome: string, roleInProject: RoleInProject = RoleInProject.ENGINEER, role: Role = GlobalRole.ENG): ConstructionProjectMember {
  return {
    id,
    constructionProjectId: 7,
    user: { id, name: nome, email: `${id}@alfa.com`, role },
    roleInProject,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

function disponivel(id: number, nome: string, role: WorkspaceRole = WorkspaceRole.MEMBER): AvailableUser {
  return { id, name: nome, email: `${nome.toLowerCase()}@alfa.com`, role }
}

/** Permissões padrão por papel, como o backend devolve. */
const PADRAO: Record<ProjectRole, Permission[]> = {
  OWNER: [ProjectPermission.VIEW_PROJECT, ProjectPermission.MANAGE_MEMBERS],
  ENGINEER: [ProjectPermission.VIEW_PROJECT, ProjectPermission.MANAGE_MEMBERS, ProjectPermission.MANAGE_DIARY],
  ARCHITECT: [ProjectPermission.VIEW_PROJECT],
  FOREMAN: [ProjectPermission.VIEW_PROJECT, ProjectPermission.MANAGE_TASKS],
}

function render() {
  return renderWithProviders(<EquipesTab obraId={7} />)
}

async function renderCarregado() {
  const view = render()
  await screen.findByRole("region", { name: "Pessoas" })
  return view
}

function linhas() {
  return within(screen.getByRole("region", { name: "Pessoas" })).getAllByRole("listitem")
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getMyProfile).mockResolvedValue(EU)
  listarMembros.mockResolvedValue([
    membro(1, "Ana Souza"),
    membro(2, "Carlos Lima", RoleInProject.FOREMAN),
    membro(3, "Dona Marta", RoleInProject.OWNER),
    { ...membro(4, "Rui Cliente", RoleInProject.USER, GlobalRole.USER), membershipStatus: "PENDING" },
  ])
  permissoes.mockImplementation(async (_id, role) => ({ role, permissions: PADRAO[role] }))
  disponiveis.mockResolvedValue([disponivel(8, "Beatriz"), disponivel(9, "Caio", WorkspaceRole.CLIENT)])
  adicionar.mockImplementation(async (_id, data) => ({ ...membro(data.userId, "Beatriz"), membershipStatus: "ACTIVE" }))
  trocarPapel.mockImplementation(async (_id, memberId, role) => membro(memberId, "x", role))
  remover.mockResolvedValue(undefined)
  salvarPermissoes.mockImplementation(async (_id, role, perms) => ({ role, permissions: perms }))
})

describe("<EquipesTab /> — pessoas", () => {
  it("mostra o esqueleto enquanto carrega", () => {
    listarMembros.mockImplementation(() => new Promise(() => {}))
    const { container } = render()
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
  })

  it("ordena pelo papel, marca você e o convite pendente", async () => {
    await renderCarregado()

    const nomes = linhas().map((li) => li.querySelector("p")?.textContent)
    expect(nomes[0]).toContain("Dona Marta")
    expect(nomes[1]).toContain("Ana Souza")
    expect(nomes[1]).toContain("você")
    expect(nomes[3]).toContain("Rui Cliente")
    expect(screen.getByText("Convite pendente")).toBeInTheDocument()
  })

  it("troca o papel pelo select, mas não o seu nem o do responsável", async () => {
    await renderCarregado()

    expect(screen.queryByRole("combobox", { name: "Papel de Ana Souza" })).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox", { name: "Papel de Dona Marta" })).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Papel de Carlos Lima" }), RoleInProject.ARCHITECT)
    await waitFor(() => expect(trocarPapel).toHaveBeenCalledWith(7, 2, RoleInProject.ARCHITECT))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Carlos agora é arquiteto."))
  })

  it("remove com Desfazer: sai da lista e do servidor depois", async () => {
    relogioDoDesfazer()
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: "Remover Carlos Lima da obra" }))

    await waitFor(() => expect(screen.queryByText("Carlos Lima")).not.toBeInTheDocument())
    expect(remover).not.toHaveBeenCalled()
    await passarJanelaDoDesfazer()
    await waitFor(() => expect(remover).toHaveBeenCalledWith(7, 2))
  })

  it("mostra o erro do servidor ao trocar papel", async () => {
    trocarPapel.mockRejectedValue(new Error("Sem permissão."))
    await renderCarregado()
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Papel de Carlos Lima" }), RoleInProject.USER)
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sem permissão."))
  })
})

describe("<EquipesTab /> — adicionar", () => {
  it("busca, escolhe a pessoa e o papel e adiciona", async () => {
    await renderCarregado()
    await userEvent.click(within(screen.getByRole("region", { name: "Pessoas" })).getByRole("button", { name: /Adicionar pessoa/ }))
    const dialog = within(await screen.findByRole("dialog", { name: "Adicionar à obra" }))

    await dialog.findByRole("option", { name: /Beatriz/ })
    await userEvent.type(dialog.getByPlaceholderText(/Pesquise/), "zzz")
    expect(dialog.getByText("Ninguém encontrado com essa busca.")).toBeInTheDocument()
    await userEvent.clear(dialog.getByPlaceholderText(/Pesquise/))

    await userEvent.click(dialog.getByRole("option", { name: /Beatriz/ }))
    expect(dialog.getByRole("radio", { name: /Mestre de obras/ })).toHaveTextContent("2 de 10 permissões")
    await userEvent.click(dialog.getByRole("radio", { name: /Mestre de obras/ }))
    await userEvent.click(dialog.getByRole("button", { name: "Adicionar" }))

    await waitFor(() => expect(adicionar).toHaveBeenCalledWith(7, { userId: 8, roleInProject: RoleInProject.FOREMAN }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("cliente da conta só entra como cliente", async () => {
    await renderCarregado()
    await userEvent.click(within(screen.getByRole("region", { name: "Pessoas" })).getByRole("button", { name: /Adicionar pessoa/ }))
    const dialog = within(await screen.findByRole("dialog"))

    await userEvent.click(await dialog.findByRole("option", { name: /Caio/ }))
    expect(dialog.getByRole("radio", { name: /Cliente/ })).toHaveAttribute("aria-checked", "true")
    expect(dialog.getByRole("radio", { name: /Engenheiro/ })).toBeDisabled()
  })

  it("avisa quando todos da conta já estão na obra", async () => {
    disponiveis.mockResolvedValue([disponivel(1, "Ana Souza")])
    await renderCarregado()
    await userEvent.click(within(screen.getByRole("region", { name: "Pessoas" })).getByRole("button", { name: /Adicionar pessoa/ }))
    expect(await screen.findByText("Todos da conta já estão nesta obra.")).toBeInTheDocument()
  })
})

describe("<EquipesTab /> — papéis e permissões", () => {
  it("mostra a matriz com as 10 permissões e quantos ocupam cada papel", async () => {
    await renderCarregado()
    const matriz = within(await screen.findByRole("region", { name: "Papéis e permissões" }))

    expect(await matriz.findAllByRole("row")).toHaveLength(11)
    expect(matriz.getByRole("button", { name: "Engenheiro: Escrever no diário da obra" })).toHaveAttribute("aria-pressed", "true")
    expect(matriz.getByRole("columnheader", { name: /Mestre de obras/ })).toHaveTextContent("1")
  })

  it("salva só os papéis alterados, preservando o que já tinham", async () => {
    await renderCarregado()
    const matriz = within(await screen.findByRole("region", { name: "Papéis e permissões" }))

    await userEvent.click(await matriz.findByRole("button", { name: "Arquiteto: Criar e atualizar tarefas" }))
    await userEvent.click(matriz.getByRole("button", { name: "Salvar alterações" }))

    await waitFor(() => expect(salvarPermissoes).toHaveBeenCalledTimes(1))
    expect(salvarPermissoes).toHaveBeenCalledWith(7, ProjectRole.ARCHITECT, [ProjectPermission.VIEW_PROJECT, ProjectPermission.MANAGE_TASKS])
  })

  it("descarta o rascunho", async () => {
    await renderCarregado()
    const matriz = within(await screen.findByRole("region", { name: "Papéis e permissões" }))
    const celula = await matriz.findByRole("button", { name: "Arquiteto: Criar e atualizar tarefas" })

    await userEvent.click(celula)
    expect(celula).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(matriz.getByRole("button", { name: "Descartar" }))
    expect(celula).toHaveAttribute("aria-pressed", "false")
    expect(salvarPermissoes).not.toHaveBeenCalled()
  })

  it("esmaece quem não ocupa o papel em foco", async () => {
    await renderCarregado()
    const matriz = within(await screen.findByRole("region", { name: "Papéis e permissões" }))

    fireEvent.mouseEnter(await matriz.findByRole("columnheader", { name: /Mestre de obras/ }))
    const carlos = linhas().find((li) => li.textContent?.includes("Carlos Lima"))
    const ana = linhas().find((li) => li.textContent?.includes("Ana Souza"))
    expect(carlos).not.toHaveClass("opacity-40")
    expect(ana).toHaveClass("opacity-40")
  })

  it("avisa quando a gravação falha", async () => {
    salvarPermissoes.mockRejectedValue(new Error(""))
    await renderCarregado()
    const matriz = within(await screen.findByRole("region", { name: "Papéis e permissões" }))
    await userEvent.click(await matriz.findByRole("button", { name: "Arquiteto: Criar e atualizar tarefas" }))
    await userEvent.click(matriz.getByRole("button", { name: "Salvar alterações" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível salvar as permissões."))
  })
})

describe("<EquipesTab /> — falhas", () => {
  it("avisa quando as permissões não carregam", async () => {
    // O próprio papel (engenheiro) carrega — é o que dá acesso à matriz; os outros falham.
    permissoes.mockImplementation(async (_id, role) => {
      if (role !== ProjectRole.ENGINEER) throw new Error("falhou")
      return { role, permissions: PADRAO.ENGINEER }
    })
    await renderCarregado()
    expect(await screen.findByText("Não foi possível carregar as permissões.")).toBeInTheDocument()
  })

  it("usa a mensagem padrão quando o servidor não explica", async () => {
    relogioDoDesfazer()
    adicionar.mockRejectedValue(new Error(""))
    remover.mockRejectedValue(new Error(""))
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: "Remover Carlos Lima da obra" }))
    await passarJanelaDoDesfazer()
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível remover da obra."))

    await userEvent.click(within(screen.getByRole("region", { name: "Pessoas" })).getByRole("button", { name: /Adicionar pessoa/ }))
    const dialog = within(await screen.findByRole("dialog", { name: "Adicionar à obra" }))
    await userEvent.click(await dialog.findByRole("option", { name: /Beatriz/ }))
    await userEvent.click(dialog.getByRole("button", { name: "Adicionar" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível adicionar à obra."))
  })
})

describe("<EquipesTab /> — sem gestão", () => {
  it("quem não gerencia só vê as pessoas", async () => {
    permissoes.mockImplementation(async (_id, role) => ({ role, permissions: [ProjectPermission.VIEW_PROJECT] }))
    await renderCarregado()

    await waitFor(() => expect(screen.queryByRole("button", { name: /Adicionar pessoa/ })).not.toBeInTheDocument())
    expect(screen.queryByRole("region", { name: "Papéis e permissões" })).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
  })
})

afterEach(() => {
  vi.useRealTimers()
})
