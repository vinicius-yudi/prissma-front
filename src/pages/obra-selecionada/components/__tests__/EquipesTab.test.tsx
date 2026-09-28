import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole, type Role } from "@/shared/types/user"
import { WorkspaceRole } from "@/shared/types/workspace"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  addEquipeMember,
  getAvailableUsers,
  getEquipeMembers,
  removeEquipeMember,
} from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
  updateRolePermissions,
} from "../../services/projectPermissions.service"
import {
  RoleInProject,
  type AvailableUser,
  type ConstructionProjectMember,
} from "../../types/equipes"
import { EquipesTab } from "../EquipesTab"
import { RolePermissionsEditor } from "../RolePermissionsEditor"

vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
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
const listarDisponiveis = vi.mocked(getAvailableUsers)
const perfil = vi.mocked(getMyProfile)
const permissoes = vi.mocked(getRolePermissions)
const salvarPermissoes = vi.mocked(updateRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

function membro(
  id: number,
  nome: string,
  role: Role = GlobalRole.ENG,
  roleInProject: RoleInProject = RoleInProject.ENGINEER,
): ConstructionProjectMember {
  return {
    id,
    constructionProjectId: 7,
    user: { id, name: nome, email: `${id}@alfa.com`, role },
    roleInProject,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

function disponivel(id: number, nome: string, role: WorkspaceRole): AvailableUser {
  return { id, name: nome, email: `${id}@alfa.com`, role }
}

function render() {
  return renderWithProviders(<EquipesTab obraId={7} />)
}

/** Monta e espera sair do esqueleto de carregamento dos membros. */
async function renderCarregado() {
  const view = render()
  await screen.findByText("Equipe da obra")
  return view
}

function secao(titulo: string) {
  return within(screen.getByText(titulo).closest("section") as HTMLElement)
}

beforeEach(() => {
  vi.resetAllMocks()
  // EU entra como membro por padrão: é do vínculo dele com a obra que
  // `useProjectPermissions` deriva o papel — sem isso a query de permissões
  // nem dispara e a tela cai no perfil sem ação nenhuma.
  listarMembros.mockResolvedValue([membro(1, "Ana Souza")])
  listarDisponiveis.mockResolvedValue([])
  perfil.mockResolvedValue(EU)
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.VIEW_PROJECT, ProjectPermission.MANAGE_MEMBERS],
  })
  adicionar.mockResolvedValue({
    id: 99,
    constructionProjectId: 7,
    user: { id: 2, name: "Bia", email: "bia@alfa.com", role: GlobalRole.ENG },
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  })
  remover.mockResolvedValue(undefined)
  salvarPermissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
})

describe("<EquipesTab /> — seções", () => {
  it("mostra o esqueleto enquanto os membros carregam", () => {
    listarMembros.mockImplementation(() => new Promise(() => {}))

    const { container } = render()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(2)
  })

  it("desenha os dois grupos", async () => {
    await renderCarregado()

    expect(screen.getByText("Equipe da obra")).toBeInTheDocument()
    expect(screen.getByText("Clientes")).toBeInTheDocument()
  })

  /**
   * O grupo é decidido pelo papel GLOBAL da conta, não pelo papel na obra:
   * cliente é quem tem conta de cliente, mesmo que esteja vinculado à obra
   * com outro papel.
   */
  it("separa colaboradores de clientes pelo papel da conta", async () => {
    listarMembros.mockResolvedValue([
      membro(1, "Ana Souza", GlobalRole.ENG),
      membro(2, "Caio Reis", GlobalRole.ARQ),
      membro(3, "Cliente Alfa", GlobalRole.USER, RoleInProject.USER),
    ])

    await renderCarregado()

    expect(secao("Equipe da obra").getByText("Ana Souza")).toBeInTheDocument()
    expect(secao("Equipe da obra").getByText("Caio Reis")).toBeInTheDocument()
    expect(secao("Clientes").queryByText("Ana Souza")).not.toBeInTheDocument()
  })

  // A equipe abre por padrão; clientes fica recolhido — é a lista que se
  // consulta menos.
  it("abre a equipe e mantém clientes recolhido", async () => {
    listarMembros.mockResolvedValue([
      membro(1, "Ana Souza"),
      membro(3, "Cliente Alfa", GlobalRole.USER, RoleInProject.USER),
    ])

    await renderCarregado()

    expect(screen.getByText("Ana Souza")).toBeInTheDocument()
    expect(screen.queryByText("Cliente Alfa")).not.toBeInTheDocument()
  })

  it("abre o grupo de clientes no clique", async () => {
    listarMembros.mockResolvedValue([
      membro(3, "Cliente Alfa", GlobalRole.USER, RoleInProject.USER),
    ])
    await renderCarregado()

    await userEvent.click(screen.getByText("Clientes"))

    expect(screen.getByText("Cliente Alfa")).toBeInTheDocument()
  })

  it("conta as pessoas de cada grupo", async () => {
    listarMembros.mockResolvedValue([membro(1, "Ana Souza"), membro(2, "Caio Reis")])

    await renderCarregado()

    expect(secao("Equipe da obra").getByText("2 pessoas")).toBeInTheDocument()
  })
})

describe("<EquipesTab /> — remover integrante", () => {
  beforeEach(() => {
    listarMembros.mockResolvedValue([
      membro(1, "Ana Souza"),
      membro(2, "Dono Beta", GlobalRole.ENG, RoleInProject.OWNER),
    ])
  })

  // O dono não se remove da própria obra — a obra ficaria sem responsável.
  it("não oferece remover o dono", async () => {
    await renderCarregado()

    expect(
      screen.queryByRole("button", { name: "Remover Dono Beta da obra" }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover Ana Souza da obra" })).toBeInTheDocument()
  })

  it("pede confirmação antes de remover", async () => {
    await renderCarregado()

    await userEvent.click(screen.getByRole("button", { name: "Remover Ana Souza da obra" }))

    expect(screen.getByRole("heading", { name: "Remover pessoa" })).toBeInTheDocument()
    expect(remover).not.toHaveBeenCalled()
  })

  it("remove pelo id do vínculo ao confirmar", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: "Remover Ana Souza da obra" }))

    await userEvent.click(screen.getByRole("button", { name: "Remover" }))

    await waitFor(() => expect(remover).toHaveBeenCalledWith(7, 1))
  })

  it("desiste sem remover no cancelar", async () => {
    await renderCarregado()
    await userEvent.click(screen.getByRole("button", { name: "Remover Ana Souza da obra" }))

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("heading", { name: "Remover pessoa" })).not.toBeInTheDocument()
    expect(remover).not.toHaveBeenCalled()
  })
})

describe("<EquipesTab /> — adicionar integrante", () => {
  beforeEach(() => {
    listarDisponiveis.mockResolvedValue([
      disponivel(2, "Bia Lima", WorkspaceRole.MEMBER),
      disponivel(3, "Construtora Beta", WorkspaceRole.CLIENT),
    ])
  })

  /**
   * O grupo de clientes nasce recolhido, então o botão de adicionar dele só
   * existe depois de abrir a seção.
   */
  async function abrirModal(secaoLabel = "adicionar integrante") {
    await renderCarregado()
    if (secaoLabel !== "adicionar integrante") {
      await userEvent.click(screen.getByText("Clientes"))
    }
    await userEvent.click(screen.getByRole("button", { name: new RegExp(secaoLabel, "i") }))
  }

  /** O último combobox é o do modal; o primeiro é o seletor de papel do painel. */
  function seletorDoModal() {
    const todos = screen.getAllByRole("combobox")
    return todos[todos.length - 1]
  }

  // /workspaces/members é vetado a CLIENT: só busca quando o modal abre.
  it("só busca os disponíveis ao abrir o modal", async () => {
    await renderCarregado()

    expect(listarDisponiveis).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole("button", { name: /adicionar integrante/i }))

    await waitFor(() => expect(listarDisponiveis).toHaveBeenCalled())
  })

  it("lista só colaboradores no modal da equipe", async () => {
    await abrirModal()

    expect(await screen.findByText("Bia Lima")).toBeInTheDocument()
    expect(screen.queryByText("Construtora Beta")).not.toBeInTheDocument()
  })

  it("lista só clientes no modal de clientes", async () => {
    await abrirModal("adicionar cliente")

    expect(await screen.findByText("Construtora Beta")).toBeInTheDocument()
    expect(screen.queryByText("Bia Lima")).not.toBeInTheDocument()
  })

  it("mantém o confirmar travado até alguém ser escolhido", async () => {
    await abrirModal()
    await screen.findByText("Bia Lima")

    expect(screen.getByRole("button", { name: "Adicionar" })).toBeDisabled()
  })

  it("adiciona com o papel escolhido no seletor", async () => {
    await abrirModal()
    await userEvent.click(await screen.findByText("Bia Lima"))

    await userEvent.selectOptions(seletorDoModal(), RoleInProject.FOREMAN)
    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    await waitFor(() =>
      expect(adicionar).toHaveBeenCalledWith(7, {
        userId: 2,
        roleInProject: RoleInProject.FOREMAN,
      }),
    )
  })

  // Pelo grupo de clientes o papel é fixo: quem entra por ali é cliente, e o
  // seletor de papel nem aparece.
  it("adiciona cliente com papel fixo, sem oferecer o seletor", async () => {
    await abrirModal("adicionar cliente")
    await userEvent.click(await screen.findByText("Construtora Beta"))

    expect(screen.queryByText("Papel na obra")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    await waitFor(() =>
      expect(adicionar).toHaveBeenCalledWith(7, {
        userId: 3,
        roleInProject: RoleInProject.USER,
      }),
    )
  })

  it("filtra a lista pela busca", async () => {
    listarDisponiveis.mockResolvedValue([
      disponivel(2, "Bia Lima", WorkspaceRole.MEMBER),
      disponivel(4, "Caio Reis", WorkspaceRole.MEMBER),
    ])
    await abrirModal()
    await screen.findByText("Bia Lima")

    await userEvent.type(screen.getByPlaceholderText(/Pesquise por nome/), "Caio")

    expect(screen.getByText("Caio Reis")).toBeInTheDocument()
    expect(screen.queryByText("Bia Lima")).not.toBeInTheDocument()
  })

  it("avisa quando a busca não encontra ninguém", async () => {
    await abrirModal()
    await screen.findByText("Bia Lima")

    await userEvent.type(screen.getByPlaceholderText(/Pesquise por nome/), "zzz")

    expect(
      screen.getByText("Nenhum colaborador encontrado com este critério."),
    ).toBeInTheDocument()
  })

  it("avisa quando não há ninguém disponível", async () => {
    listarDisponiveis.mockResolvedValue([])

    await abrirModal()

    expect(
      await screen.findByText("Nenhum colaborador disponível para adicionar."),
    ).toBeInTheDocument()
  })

  it("carrega mais resultados quando passam de cinco", async () => {
    listarDisponiveis.mockResolvedValue(
      Array.from({ length: 8 }, (_, i) =>
        disponivel(i + 10, `Colaborador ${i + 1}`, WorkspaceRole.MEMBER),
      ),
    )
    await abrirModal()
    await screen.findByText("Colaborador 1")

    await userEvent.click(screen.getByRole("button", { name: "Carregar mais resultados" }))

    expect(screen.getByText("Colaborador 8")).toBeInTheDocument()
  })
})

describe("<EquipesTab /> — permissão de gerir", () => {
  it("esconde adicionar e remover de quem não gerencia membros", async () => {
    listarMembros.mockResolvedValue([membro(1, "Ana Souza")])
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    await renderCarregado()

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /adicionar integrante/i }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.queryByRole("button", { name: "Remover Ana Souza da obra" }),
    ).not.toBeInTheDocument()
  })

  // O editor de permissões da obra exige a mesma permissão que o backend
  // cobra no PUT.
  it("esconde o editor de permissões de quem não gerencia membros", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    await renderCarregado()

    await waitFor(() =>
      expect(screen.queryByText("Permissões do papel")).not.toBeInTheDocument(),
    )
  })

  it("libera tudo para o admin da plataforma, mesmo sem papel na obra", async () => {
    perfil.mockResolvedValue({ ...EU, role: GlobalRole.ADMIN })
    listarMembros.mockResolvedValue([])

    await renderCarregado()

    expect(
      await screen.findByRole("button", { name: /adicionar integrante/i }),
    ).toBeInTheDocument()
  })
})

describe("<EquipesTab /> — permissões por papel", () => {
  it("mostra o editor do papel selecionado", async () => {
    await renderCarregado()

    expect(await screen.findByText("Permissões do papel")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar permissões" })).toBeInTheDocument()
  })

  it("recarrega as permissões ao trocar de papel", async () => {
    await renderCarregado()
    await screen.findByText("Permissões do papel")

    const [seletorDePapel] = screen.getAllByRole("combobox")
    await userEvent.selectOptions(seletorDePapel, ProjectRole.FOREMAN)

    await waitFor(() => expect(permissoes).toHaveBeenCalledWith(7, ProjectRole.FOREMAN))
  })

  // Admin da plataforma para o painel aparecer mesmo com a consulta de
  // permissões falhando — é ela que normalmente libera a tela.
  it("avisa quando as permissões do papel não carregam", async () => {
    perfil.mockResolvedValue({ ...EU, role: GlobalRole.ADMIN })
    permissoes.mockRejectedValue(new Error("Erro 500"))

    await renderCarregado()

    expect(
      await screen.findByText("Não foi possível carregar as permissões deste papel."),
    ).toBeInTheDocument()
  })
})

describe("<RolePermissionsEditor />", () => {
  it("marca as permissões que o papel já tem", () => {
    renderWithProviders(
      <RolePermissionsEditor
        projectId={7}
        role={ProjectRole.ENGINEER}
        initialPermissions={[ProjectPermission.MANAGE_TASKS]}
      />,
    )

    expect(screen.getByRole("checkbox", { name: "Gerenciar tarefas" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Gerenciar orçamento" })).not.toBeChecked()
  })

  // O PUT manda a lista COMPLETA, não um diff: desmarcar precisa sair do
  // payload, senão a permissão nunca é revogada.
  it("manda a lista completa depois de marcar e desmarcar", async () => {
    renderWithProviders(
      <RolePermissionsEditor
        projectId={7}
        role={ProjectRole.ENGINEER}
        initialPermissions={[ProjectPermission.MANAGE_TASKS]}
      />,
    )

    await userEvent.click(screen.getByRole("checkbox", { name: "Gerenciar tarefas" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "Visualizar projeto" }))
    await userEvent.click(screen.getByRole("button", { name: "Salvar permissões" }))

    await waitFor(() =>
      expect(salvarPermissoes).toHaveBeenCalledWith(7, ProjectRole.ENGINEER, [
        ProjectPermission.VIEW_PROJECT,
      ]),
    )
  })

  it("avisa o pai quando a gravação conclui", async () => {
    const onSaved = vi.fn()
    renderWithProviders(
      <RolePermissionsEditor
        projectId={7}
        role={ProjectRole.ENGINEER}
        initialPermissions={[]}
        onSaved={onSaved}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Salvar permissões" }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
  })
})
