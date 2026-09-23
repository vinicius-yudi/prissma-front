import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { NewWorkspaceModal } from "../NewWorkspaceModal"

vi.mock("@/shared/hooks/useWorkspaces", () => ({ useWorkspaces: vi.fn() }))

const { useWorkspaces } = await import("@/shared/hooks/useWorkspaces")
const contas = vi.mocked(useWorkspaces)

const create = vi.fn()

function mockContas(over: Partial<ReturnType<typeof useWorkspaces>> = {}) {
  contas.mockReturnValue({
    workspaces: [],
    isLoading: false,
    switchTo: vi.fn(),
    isSwitching: false,
    create,
    isCreating: false,
    createError: null,
    ...over,
  })
}

const onClose = vi.fn()

function render() {
  return renderWithProviders(<NewWorkspaceModal open onClose={onClose} />)
}

function campo() {
  return screen.getByRole("textbox")
}

function botao() {
  return screen.getByRole("button", { name: /conta|Criando/i })
}

beforeEach(() => {
  vi.resetAllMocks()
  mockContas()
})

describe("<NewWorkspaceModal />", () => {
  it("não renderiza nada fechado", () => {
    renderWithProviders(<NewWorkspaceModal open={false} onClose={onClose} />)

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("cria a conta com o nome digitado", async () => {
    render()

    await userEvent.type(campo(), "Construtora Beta")
    await userEvent.click(botao())

    expect(create).toHaveBeenCalledWith("Construtora Beta")
  })

  // Espaço em branco em volta do nome viraria uma conta chamada " Beta " na
  // lista de troca.
  it("apara os espaços do nome", async () => {
    render()

    await userEvent.type(campo(), "   Construtora Beta   ")
    await userEvent.click(botao())

    expect(create).toHaveBeenCalledWith("Construtora Beta")
  })

  it("recusa nome só de espaços", async () => {
    render()

    await userEvent.type(campo(), "   ")
    await userEvent.click(botao())

    expect(create).not.toHaveBeenCalled()
  })

  // Dois cliques no botão criariam duas contas: o backend não deduplica por
  // nome.
  it("não envia duas vezes enquanto a criação está em voo", async () => {
    mockContas({ isCreating: true })
    render()

    await userEvent.type(campo(), "Construtora Beta")
    await userEvent.click(botao())

    expect(create).not.toHaveBeenCalled()
    expect(botao()).toBeDisabled()
  })

  it("mostra a mensagem do backend quando a criação falha", () => {
    mockContas({ createError: new Error("Limite de contas atingido.") })

    render()

    expect(screen.getByText("Limite de contas atingido.")).toBeInTheDocument()
  })

  it("cai numa mensagem traduzida quando o erro não tem texto", () => {
    mockContas({ createError: new Error("") })

    render()

    expect(screen.getByText("Não foi possível criar a conta.")).toBeInTheDocument()
  })

  it("fecha no botão de fechar do modal", async () => {
    render()

    await userEvent.keyboard("{Escape}")

    expect(onClose).toHaveBeenCalled()
  })
})
