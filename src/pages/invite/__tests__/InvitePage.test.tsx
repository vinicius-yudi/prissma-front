import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { acceptInvite } from "@/shared/services/workspace.service"
import { renderWithProviders } from "@/test/renderWithProviders"

import { InvitePage } from "../index"

vi.mock("@/shared/services/workspace.service", () => ({
  acceptInvite: vi.fn(),
  getWorkspaceMembers: vi.fn(),
  inviteMember: vi.fn(),
  updateMemberRole: vi.fn(),
  deactivateMember: vi.fn(),
  removeMember: vi.fn(),
  getWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  switchWorkspace: vi.fn(),
}))

const aceitar = vi.mocked(acceptInvite)

const TOKEN = "tok-123"

function render(route = `/invite?token=${TOKEN}`) {
  return renderWithProviders(<InvitePage />, { route })
}

beforeEach(() => {
  vi.resetAllMocks()
  aceitar.mockResolvedValue(undefined)
})

/**
 * Rota PÚBLICA: o convidado pode ainda não ter conta. Nome e senha só são
 * exigidos pelo backend quando o e-mail é novo; para quem já tem conta os
 * campos são ignorados no servidor.
 */
describe("<InvitePage />", () => {
  it("avisa quando o link veio sem token", () => {
    render("/invite")

    expect(screen.getByText(/link/i)).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("mostra o formulário quando há token", () => {
    render()

    expect(screen.getByRole("button", { name: /Aceitar|aceitar/ })).toBeInTheDocument()
  })

  it("aceita o convite com o token do link", async () => {
    render()

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(aceitar).toHaveBeenCalledWith(TOKEN, {
        fullName: undefined,
        password: undefined,
      }),
    )
  })

  it("manda nome e senha quando preenchidos", async () => {
    render()

    await userEvent.type(screen.getAllByRole("textbox")[0], "  Ana Souza  ")
    await userEvent.type(
      document.querySelector('input[type="password"]') as HTMLInputElement,
      "Segredo@1",
    )
    await userEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(aceitar).toHaveBeenCalledWith(TOKEN, {
        fullName: "Ana Souza",
        password: "Segredo@1",
      }),
    )
  })

  // Depois de aceitar, o caminho é o login: o convidado ainda não tem sessão.
  it("troca o formulário pelo atalho de login ao concluir", async () => {
    render()

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByRole("link")).toHaveAttribute("href", "/login")
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument()
  })

  it("mostra a mensagem do backend quando o convite falha", async () => {
    aceitar.mockRejectedValue(new Error("Convite expirado."))
    render()

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByText("Convite expirado.")).toBeInTheDocument()
  })

  // Erro sem texto (queda de rede) não pode virar uma linha em branco.
  it("cai numa mensagem traduzida quando o erro não tem texto", async () => {
    aceitar.mockRejectedValue(new Error(""))
    render()

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByText("Convite inválido ou expirado.")).toBeInTheDocument()
  })

  it("mantém o formulário aberto para nova tentativa depois do erro", async () => {
    aceitar.mockRejectedValue(new Error("Convite expirado."))
    render()

    await userEvent.click(screen.getByRole("button"))

    await screen.findByText("Convite expirado.")
    expect(screen.getByRole("button")).toBeEnabled()
  })

  it("bloqueia o botão durante o envio", async () => {
    aceitar.mockImplementation(() => new Promise(() => {}))
    render()

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(screen.getByRole("button")).toBeDisabled())
  })
})
