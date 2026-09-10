import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { createProject, updateProject } from "../../services/projects.service"
import { ProjectStepModal } from "../ProjectStepModal"

vi.mock("../../services/projects.service", () => ({
  listProjects: vi.fn(),
  getProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const criar = vi.mocked(createProject)
const editar = vi.mocked(updateProject)

const onClose = vi.fn()

function obra(over: Partial<Project> = {}): Project {
  return {
    id: 7,
    title: "Residencial Alfa",
    address: "Rua das Palmeiras, 100",
    street: "Rua das Palmeiras",
    number: "100",
    complement: "Bloco A",
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
    plannedEndDate: "2026-12-01",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function render(project: Project | null = null) {
  return renderWithProviders(
    <ProjectStepModal open onClose={onClose} project={project} />,
  )
}

function campoNumerico(indice: number) {
  return screen.getAllByRole("spinbutton")[indice]
}

function datas(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="date"]'))
}

/** Preenche o passo 1 com o mínimo válido e avança. */
async function preencherPasso1() {
  await userEvent.type(screen.getByPlaceholderText("Ex: Residencial Aurora"), "Residencial Alfa")
  await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "RESIDENTIAL")
  await userEvent.selectOptions(screen.getAllByRole("combobox")[1], "BUILDING")
  await userEvent.clear(campoNumerico(0))
  await userEvent.type(campoNumerico(0), "400")
  await userEvent.clear(campoNumerico(1))
  await userEvent.type(campoNumerico(1), "250")
  await userEvent.type(datas()[0], "2026-03-01")
  await userEvent.type(datas()[1], "2026-12-01")
  await userEvent.click(screen.getByRole("button", { name: /Próximo/ }))
}

/** Preenche o passo 2 com o mínimo válido. */
async function preencherPasso2() {
  await userEvent.type(screen.getByPlaceholderText("00000-000"), "01001000")
  await userEvent.type(screen.getByPlaceholderText("SP"), "SP")
  await userEvent.type(screen.getByPlaceholderText("Rua, Avenida..."), "Rua das Palmeiras")
  await userEvent.type(screen.getByPlaceholderText("123"), "100")
  await userEvent.type(screen.getByPlaceholderText("Nome do bairro"), "Centro")
  await userEvent.type(screen.getByPlaceholderText("Nome da cidade"), "São Paulo")
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers({ shouldAdvanceTime: true })
  // A busca de CEP é a única chamada direta a rede externa (viacep) no
  // projeto; sem stub ela vazaria para fora do teste.
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({ erro: true }) }))
  // `createProject` não devolve a obra criada — a lista recarrega pelo cache.
  criar.mockResolvedValue(undefined)
  editar.mockResolvedValue(obra())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("<ProjectStepModal /> — abertura", () => {
  it("não renderiza nada fechado", () => {
    renderWithProviders(<ProjectStepModal open={false} onClose={onClose} />)

    expect(screen.queryByRole("heading")).not.toBeInTheDocument()
  })

  it("abre no passo 1 para criar", () => {
    render()

    expect(screen.getByRole("heading", { name: "Nova Obra" })).toBeInTheDocument()
    expect(screen.getByText("Obra")).toBeInTheDocument()
    expect(screen.getByText("Endereço")).toBeInTheDocument()
  })

  it("abre preenchido para editar", () => {
    render(obra())

    expect(screen.getByRole("heading", { name: "Editar Obra" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Residencial Alfa")).toBeInTheDocument()
    expect(screen.getByDisplayValue("400")).toBeInTheDocument()
  })

  // O status só existe em obra já criada: no cadastro toda obra nasce em
  // planejamento, e oferecer "Concluída" no formulário de criação seria
  // convidar a mentir sobre o andamento.
  it("só oferece o status ao editar", () => {
    const { rerender } = render()
    expect(screen.getAllByRole("combobox")).toHaveLength(2)

    rerender(<ProjectStepModal open onClose={onClose} project={obra()} />)

    expect(screen.getAllByRole("combobox")).toHaveLength(3)
  })
})

describe("<ProjectStepModal /> — navegação entre passos", () => {
  it("só avança com o passo 1 válido", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: /Próximo/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.queryByPlaceholderText("00000-000")).not.toBeInTheDocument()
  })

  it("avança para o endereço com o passo 1 preenchido", async () => {
    render()

    await preencherPasso1()

    expect(await screen.findByPlaceholderText("00000-000")).toBeInTheDocument()
  })

  // Voltar preserva o que já foi digitado: reabrir o passo 1 em branco faria
  // o usuário redigitar tudo para corrigir uma vírgula do endereço.
  it("volta ao passo 1 sem perder o que foi digitado", async () => {
    render()
    await preencherPasso1()

    await userEvent.click(screen.getByRole("button", { name: /Voltar/ }))

    expect(screen.getByDisplayValue("Residencial Alfa")).toBeInTheDocument()
  })

  it("mostra o endereço atual no passo 2 ao editar", async () => {
    render(obra())

    await userEvent.click(screen.getByRole("button", { name: /Próximo/ }))

    expect(await screen.findByText("Endereço atual")).toBeInTheDocument()
  })
})

describe("<ProjectStepModal /> — gravação", () => {
  it("cria a obra com endereço em campos separados", async () => {
    render()
    await preencherPasso1()
    await preencherPasso2()

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(criar).toHaveBeenCalled())
    expect(criar.mock.calls[0][0]).toMatchObject({
      title: "Residencial Alfa",
      street: "Rua das Palmeiras",
      number: "100",
      zipCode: "01001000",
      city: "São Paulo",
      state: "SP",
      landArea: 400,
      builtArea: 250,
    })
  })

  it("edita pela rota da própria obra", async () => {
    render(obra())
    await userEvent.click(screen.getByRole("button", { name: /Próximo/ }))
    await screen.findByText("Endereço atual")

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(editar).toHaveBeenCalled())
    expect(editar.mock.calls[0][0]).toBe(7)
  })

  it("avisa por toast quando o passo 2 está incompleto", async () => {
    render()
    await preencherPasso1()

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(criar).not.toHaveBeenCalled()
  })

  it("fecha no cancelar do passo 1", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onClose).toHaveBeenCalled()
    expect(criar).not.toHaveBeenCalled()
  })
})

/**
 * O CEP é a única chamada a uma API pública direto da UI (viacep). A máscara
 * é só de exibição — o payload leva os oito dígitos crus, que é o que o
 * backend guarda.
 */
describe("<ProjectStepModal /> — CEP", () => {
  async function irParaEndereco() {
    render()
    await preencherPasso1()
    await screen.findByPlaceholderText("00000-000")
  }

  it("mostra o CEP mascarado mantendo os dígitos no formulário", async () => {
    await irParaEndereco()

    await userEvent.type(screen.getByPlaceholderText("00000-000"), "01001000")

    expect(screen.getByPlaceholderText("00000-000")).toHaveValue("01001-000")
  })

  it("descarta o que não é dígito", async () => {
    await irParaEndereco()

    await userEvent.type(screen.getByPlaceholderText("00000-000"), "abc01001")

    expect(screen.getByPlaceholderText("00000-000")).toHaveValue("01001")
  })

  it("preenche o endereço com o retorno da consulta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          logradouro: "Praça da Sé",
          bairro: "Sé",
          localidade: "São Paulo",
          uf: "SP",
        }),
      }),
    )
    await irParaEndereco()

    await userEvent.type(screen.getByPlaceholderText("00000-000"), "01001000")
    await vi.advanceTimersByTimeAsync(600)

    await waitFor(() => expect(screen.getByDisplayValue("Praça da Sé")).toBeInTheDocument())
    expect(screen.getByDisplayValue("Sé")).toBeInTheDocument()
    expect(screen.getByDisplayValue("São Paulo")).toBeInTheDocument()
  })

  it("avisa quando o CEP não existe", async () => {
    await irParaEndereco()

    await userEvent.type(screen.getByPlaceholderText("00000-000"), "00000000")
    await vi.advanceTimersByTimeAsync(600)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("CEP não encontrado"))
  })

  it("avisa quando a consulta de CEP falha", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))
    await irParaEndereco()

    await userEvent.type(screen.getByPlaceholderText("00000-000"), "01001000")
    await vi.advanceTimersByTimeAsync(600)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao buscar CEP"))
  })

  // Sem os oito dígitos não há o que consultar: disparar a cada tecla renderia
  // sete requisições inúteis por CEP digitado.
  it("não consulta com o CEP incompleto", async () => {
    await irParaEndereco()

    await userEvent.type(screen.getByPlaceholderText("00000-000"), "0100")
    await vi.advanceTimersByTimeAsync(600)

    expect(fetch).not.toHaveBeenCalled()
  })
})
