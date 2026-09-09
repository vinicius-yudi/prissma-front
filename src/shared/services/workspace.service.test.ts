import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { WorkspaceRole } from "@/shared/types/workspace"

import {
  acceptInvite,
  createWorkspace,
  deactivateMember,
  getWorkspaceMembers,
  getWorkspaces,
  inviteMember,
  removeMember,
  switchWorkspace,
  updateMemberRole,
} from "./workspace.service"

/**
 * Camada fina sobre o `api`: o que ela decide é a ROTA e o formato do corpo.
 * Mockar `@/lib/api` mantém o teste sem rede e mira exatamente o erro que dói
 * aqui — trocar a rota, o verbo ou a forma do payload sem querer.
 */
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const get = vi.mocked(api.get)
const post = vi.mocked(api.post)
const patch = vi.mocked(api.patch)
const del = vi.mocked(api.delete)

beforeEach(() => {
  vi.resetAllMocks()
})

describe("contas", () => {
  it("lista as contas do usuário", async () => {
    get.mockResolvedValue([{ id: 1, name: "Construtora Alfa" }])

    await expect(getWorkspaces()).resolves.toEqual([{ id: 1, name: "Construtora Alfa" }])
    expect(get).toHaveBeenCalledWith("/workspaces")
  })

  it("cria conta mandando o nome no corpo", async () => {
    post.mockResolvedValue({ id: 2 })

    await createWorkspace("Construtora Beta")

    expect(post).toHaveBeenCalledWith("/workspaces", { name: "Construtora Beta" })
  })

  // A troca de conta devolve um TOKEN novo: o workspace ativo é claim do
  // token, não estado do front. Um POST sem corpo é o contrato do backend.
  it("troca de conta sem mandar corpo", async () => {
    post.mockResolvedValue({ token: "novo-jwt" })

    await expect(switchWorkspace(9)).resolves.toEqual({ token: "novo-jwt" })
    expect(post).toHaveBeenCalledWith("/workspaces/9/switch")
  })
})

describe("membros", () => {
  it("lista os membros da conta ativa", async () => {
    get.mockResolvedValue([])

    await getWorkspaceMembers()

    expect(get).toHaveBeenCalledWith("/workspaces/members")
  })

  it("convida repassando o pedido inteiro", async () => {
    const request = { email: "ana@alfa.com", fullName: "Ana", role: WorkspaceRole.MEMBER } as const
    post.mockResolvedValue({ invitedEmail: request.email })

    await inviteMember(request)

    expect(post).toHaveBeenCalledWith("/workspaces/members/invite", request)
  })

  it("troca o papel de um membro", async () => {
    patch.mockResolvedValue({})

    await updateMemberRole(5, WorkspaceRole.ADMIN)

    expect(patch).toHaveBeenCalledWith("/workspaces/members/5", { role: WorkspaceRole.ADMIN })
  })

  // Desativar preserva o histórico do membro nas obras; remover apaga o
  // vínculo. São rotas diferentes justamente por isso.
  it("desativa e remove por caminhos distintos", async () => {
    patch.mockResolvedValue({})
    del.mockResolvedValue(undefined)

    await deactivateMember(5)
    await removeMember(5)

    expect(patch).toHaveBeenCalledWith("/workspaces/members/5/deactivate")
    expect(del).toHaveBeenCalledWith("/workspaces/members/5")
  })
})

describe("aceitar convite", () => {
  it("manda o token no caminho e os dados no corpo", async () => {
    patch.mockResolvedValue(undefined)

    await acceptInvite("tok-123", { fullName: "Ana", password: "Obra@2026" })

    expect(patch).toHaveBeenCalledWith(
      "/workspaces/invites/tok-123/accept",
      { fullName: "Ana", password: "Obra@2026" },
      { skipAuthRedirect: true },
    )
  })

  // Token de convite vem da URL e pode ter caractere que quebra o caminho.
  it("escapa o token antes de montar a rota", async () => {
    patch.mockResolvedValue(undefined)

    await acceptInvite("tok/com barra", {})

    expect(patch.mock.calls[0][0]).toBe("/workspaces/invites/tok%2Fcom%20barra/accept")
  })

  // O convidado ainda não tem sessão: um 401 aqui é "convite inválido", não
  // "sessão expirada". Sem isto o app o jogaria na tela de login.
  it("pede para o cliente não deslogar no 401", async () => {
    patch.mockResolvedValue(undefined)

    await acceptInvite("tok-123", {})

    expect(patch.mock.calls[0][2]).toEqual({ skipAuthRedirect: true })
  })
})
