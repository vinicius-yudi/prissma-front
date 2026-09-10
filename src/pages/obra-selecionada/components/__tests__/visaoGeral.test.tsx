import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"
import type { Attachment } from "@/shared/types/attachment"
import type { ProjectBudget } from "@/shared/types/budget"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { listAttachments } from "../../services/attachments.service"
import { getProjectBudget } from "../../services/budget.service"
import { getEquipeMembers } from "../../services/equipes.service"
import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
} from "../../services/projectPermissions.service"
import { listStages, type Stage } from "../../services/stages.service"
import { RoleInProject, type ConstructionProjectMember } from "../../types/equipes"
import { DocumentosRecentes } from "../DocumentosRecentes"
import { VisaoGeral } from "../visaoGeral"

vi.mock("../../services/stages.service", () => ({
  listStages: vi.fn(),
  createStage: vi.fn(),
  updateStage: vi.fn(),
  deleteStage: vi.fn(),
  reorderStages: vi.fn(),
}))
vi.mock("../../services/budget.service", () => ({
  getProjectBudget: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn(),
  createBudgetItem: vi.fn(),
  updateBudgetItem: vi.fn(),
  deleteBudgetItem: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  listExpenses: vi.fn(),
}))
vi.mock("../../services/attachments.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/attachments.service")>()),
  listAttachments: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
}))
vi.mock("@/shared/services/user.service", () => ({ getMyProfile: vi.fn() }))
vi.mock("../../services/equipes.service", () => ({
  getEquipeMembers: vi.fn(),
  addEquipeMember: vi.fn(),
  removeEquipeMember: vi.fn(),
  getAvailableUsers: vi.fn(),
}))
vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))
// Os dois modais de obra têm testes próprios em pages/projetos.
vi.mock("@/pages/projetos/components/ProjectStepModal", () => ({
  ProjectStepModal: ({ open }: { open: boolean }) => (open ? <div>modal-editar-obra</div> : null),
}))
vi.mock("@/pages/projetos/components/DeleteProjectModal", () => ({
  DeleteProjectModal: ({ project }: { project: Project | null }) =>
    project ? <div>modal-excluir-obra</div> : null,
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const listarEtapas = vi.mocked(listStages)
const buscarOrcamento = vi.mocked(getProjectBudget)
const listarAnexos = vi.mocked(listAttachments)
const perfil = vi.mocked(getMyProfile)
const membros = vi.mocked(getEquipeMembers)
const permissoes = vi.mocked(getRolePermissions)

const EU = { id: 1, name: "Ana Souza", email: "ana@alfa.com", role: GlobalRole.ENG }

const OBRA: Project = {
  id: 7,
  title: "Residencial Alfa",
  address: "Rua das Palmeiras, 100",
  street: "Rua das Palmeiras",
  number: "100",
  complement: null,
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  zipCode: "01001000",
  projectType: "RESIDENTIAL",
  category: "BUILDING",
  landArea: 400,
  builtArea: 250,
  status: ProjectStatus.IN_PROGRESS,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2099-12-31",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    constructionProjectId: 7,
    name: "Fundação",
    description: null,
    displayOrder: 1,
    status: EtapaStatus.IN_PROGRESS,
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2099-12-31",
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function membro(id: number, nome: string): ConstructionProjectMember {
  return {
    id,
    constructionProjectId: 7,
    user: { id, name: nome, email: `${id}@alfa.com`, role: GlobalRole.ENG },
    roleInProject: RoleInProject.ENGINEER,
    membershipStatus: "ACTIVE",
    joinedAt: "2026-01-01T00:00:00Z",
  }
}

const ORCAMENTO: ProjectBudget = {
  id: 5,
  constructionProjectId: 7,
  description: null,
  plannedTotal: 200_000,
  totalSpent: 50_000,
  remaining: 150_000,
  exceeded: false,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  items: [],
}

function anexo(over: Partial<Attachment> = {}): Attachment {
  return {
    id: 1,
    constructionProjectId: 7,
    stageId: null,
    taskId: null,
    uploadedByUserId: 1,
    fileName: "planta.pdf",
    fileType: "application/pdf",
    uploadedAt: "2026-02-10T00:00:00Z",
    ...over,
  }
}

function render(project = OBRA) {
  return renderWithProviders(<VisaoGeral project={project} />, {
    route: "/obras/7/visao-geral",
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  listarEtapas.mockResolvedValue([etapa()])
  buscarOrcamento.mockResolvedValue(null)
  listarAnexos.mockResolvedValue([])
  perfil.mockResolvedValue(EU)
  membros.mockResolvedValue([membro(1, "Ana Souza")])
  permissoes.mockResolvedValue({
    role: ProjectRole.ENGINEER,
    permissions: [ProjectPermission.MANAGE_PROJECT],
  })
})

describe("<VisaoGeral /> — hero", () => {
  // Nome e status não se repetem aqui: já são o H1 e o badge do cabeçalho da
  // página.
  it("mostra endereço e área sem repetir o nome da obra", async () => {
    render()

    expect(await screen.findByText(/Rua das Palmeiras.*250 m²/)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Residencial Alfa" })).not.toBeInTheDocument()
  })

  it("mostra o anel com o andamento médio das etapas", async () => {
    listarEtapas.mockResolvedValue([
      etapa({ id: 1, status: EtapaStatus.DONE }),
      etapa({ id: 2, status: EtapaStatus.PLANNED }),
    ])

    render()

    expect(await screen.findByText("50%")).toBeInTheDocument()
  })

  it("aponta a etapa atual e a posição dela no ciclo", async () => {
    listarEtapas.mockResolvedValue([
      etapa({ id: 1, name: "Fundação", displayOrder: 1, status: EtapaStatus.DONE }),
      etapa({ id: 2, name: "Alvenaria", displayOrder: 2, status: EtapaStatus.IN_PROGRESS }),
    ])

    render()

    expect(await screen.findByText("etapa 2 de 2")).toBeInTheDocument()
  })

  it("usa traços quando não há etapa nem orçamento", async () => {
    listarEtapas.mockResolvedValue([])

    render()

    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThan(0))
  })

  it("mostra o gasto e o percentual do orçamento", async () => {
    buscarOrcamento.mockResolvedValue(ORCAMENTO)

    render()

    expect(await screen.findByText("25% do orçamento")).toBeInTheDocument()
  })

  it("conta as pessoas vinculadas à obra", async () => {
    membros.mockResolvedValue([membro(1, "Ana Souza"), membro(2, "Bia Lima")])

    render()

    expect(await screen.findByText("2 pessoas na obra")).toBeInTheDocument()
  })

  // "Em atraso" vem da data: o desvio aparece como nota sob o prazo.
  it("marca o desvio quando a obra passou do prazo", async () => {
    render({ ...OBRA, plannedEndDate: "2020-01-01" })

    expect(await screen.findByText(/desvio previsto/)).toBeInTheDocument()
  })
})

/**
 * Editar e excluir a obra exigem MANAGE_PROJECT no backend. Sem o gate os
 * botões apareciam para todo membro — inclusive para o cliente, que só
 * acompanha — e a ação morria num 403.
 */
describe("<VisaoGeral /> — editar e excluir", () => {
  it("abre o modal de edição", async () => {
    render()
    await screen.findByText(/Rua das Palmeiras/)

    await userEvent.click(screen.getByRole("button", { name: /Editar/ }))

    expect(screen.getByText("modal-editar-obra")).toBeInTheDocument()
  })

  it("abre o modal de exclusão", async () => {
    render()
    await screen.findByText(/Rua das Palmeiras/)

    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }))

    expect(screen.getByText("modal-excluir-obra")).toBeInTheDocument()
  })

  it("esconde as duas ações de quem não gerencia a obra", async () => {
    permissoes.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })

    render()

    await screen.findByText(/Rua das Palmeiras/)
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument(),
    )
    expect(screen.queryByRole("button", { name: /Excluir/ })).not.toBeInTheDocument()
  })
})

describe("<VisaoGeral /> — ciclo da obra", () => {
  it("lista as etapas na ordem do ciclo com prazo e andamento", async () => {
    listarEtapas.mockResolvedValue([
      etapa({ id: 1, name: "Segunda", displayOrder: 2 }),
      etapa({ id: 2, name: "Primeira", displayOrder: 1 }),
    ])

    render()

    // O nome da etapa aparece na linha e no rótulo da barra de progresso; o
    // que interessa é a ORDEM em que a timeline os desenha.
    await screen.findAllByText("Primeira")
    const itens = screen.getAllByRole("listitem").map((li) => li.textContent)
    expect(itens[0]).toContain("Primeira")
    expect(itens[1]).toContain("Segunda")
  })

  it("marca a etapa atrasada com a contagem de dias", async () => {
    listarEtapas.mockResolvedValue([etapa({ plannedEndDate: "2020-01-01" })])

    render()

    expect(await screen.findByText(/prazo expirado/)).toBeInTheDocument()
  })

  // Etapa concluída depois do prazo já terminou: cobrar atraso ali seria pedir
  // uma ação que não existe mais.
  it("não acusa atraso em etapa concluída fora do prazo", async () => {
    listarEtapas.mockResolvedValue([
      etapa({ status: EtapaStatus.DONE, plannedEndDate: "2020-01-01" }),
    ])

    render()

    await screen.findAllByText("Fundação")
    expect(screen.queryByText(/prazo expirado/)).not.toBeInTheDocument()
  })

  // Cada resumo leva ao módulo cheio; nenhum deles edita.
  it("liga o ciclo ao módulo de etapas", async () => {
    render()

    await screen.findAllByText("Fundação")
    expect(screen.getByRole("link", { name: /Gerenciar etapas/ })).toHaveAttribute(
      "href",
      "/obras/7/etapas",
    )
  })
})

describe("<VisaoGeral /> — resumos laterais", () => {
  it("avisa quando a obra não tem orçamento", async () => {
    render()

    expect(await screen.findByText("Nenhum orçamento cadastrado.")).toBeInTheDocument()
  })

  it("liga o resumo de orçamento aos lançamentos", async () => {
    buscarOrcamento.mockResolvedValue(ORCAMENTO)

    render()

    expect(await screen.findByRole("link", { name: /Ver lançamentos/ })).toHaveAttribute(
      "href",
      "/obras/7/orcamento",
    )
  })

  it("avisa quando a obra não tem equipe", async () => {
    membros.mockResolvedValue([])

    render()

    expect(await screen.findByText("Nenhum integrante vinculado.")).toBeInTheDocument()
  })

  it("lista a equipe alocada", async () => {
    membros.mockResolvedValue([membro(1, "Ana Souza"), membro(2, "Bia Lima")])

    render()

    expect(await screen.findByText("Bia Lima")).toBeInTheDocument()
  })
})

/**
 * Só leitura e só os quatro mais recentes: o upload e a lista cheia moram em
 * Documentos, e repetir a zona de envio aqui daria dois lugares para a mesma
 * ação.
 */
describe("<DocumentosRecentes />", () => {
  function renderDocs() {
    return renderWithProviders(<DocumentosRecentes projectId={7} />)
  }

  it("mostra o esqueleto enquanto carrega", () => {
    listarAnexos.mockImplementation(() => new Promise(() => {}))

    const { container } = renderDocs()

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3)
  })

  it("avisa quando nada foi enviado", async () => {
    renderDocs()

    expect(await screen.findByText("Nenhum arquivo enviado ainda.")).toBeInTheDocument()
  })

  it("mostra os mais recentes primeiro, no máximo quatro", async () => {
    listarAnexos.mockResolvedValue(
      Array.from({ length: 6 }, (_, i) =>
        anexo({
          id: i + 1,
          fileName: `arquivo-${i + 1}.pdf`,
          uploadedAt: `2026-02-0${i + 1}T00:00:00Z`,
        }),
      ),
    )

    renderDocs()

    await screen.findByText("arquivo-6.pdf")
    expect(screen.getAllByRole("listitem")).toHaveLength(4)
    expect(screen.queryByText("arquivo-1.pdf")).not.toBeInTheDocument()
  })

  it("não exibe upload nem exclusão — a lista aqui é só leitura", async () => {
    listarAnexos.mockResolvedValue([anexo()])

    renderDocs()

    await screen.findByText("planta.pdf")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})
