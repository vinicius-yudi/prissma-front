import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  deactivateMember,
  getWorkspaceMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "@/shared/services/workspace.service"
import { WorkspaceRole, type WorkspaceMember } from "@/shared/types/workspace"
import { createHookWrapper } from "@/test/renderWithProviders"

import { useWorkspaceTeam } from "../useWorkspaceTeam"

vi.mock("@/shared/services/workspace.service", () => ({
  getWorkspaceMembers: vi.fn(),
  inviteMember: vi.fn(),
  updateMemberRole: vi.fn(),
  deactivateMember: vi.fn(),
  removeMember: vi.fn(),
  getWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  switchWorkspace: vi.fn(),
  acceptInvite: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const listar = vi.mocked(getWorkspaceMembers)
const convidar = vi.mocked(inviteMember)
const trocarPapel = vi.mocked(updateMemberRole)
const desativar = vi.mocked(deactivateMember)
const remover = vi.mocked(removeMember)

function membro(id: number, role: WorkspaceRole = WorkspaceRole.MEMBER): WorkspaceMember {
  return {
    id,
    userId: id * 100,
    name: `Membro ${id}`,
    email: `membro${id}@alfa.com`,
    role,
    active: true,
    acceptedAt: "2026-01-01T00:00:00Z",
  }
}

function render() {
  return renderHook(() => useWorkspaceTeam(), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([])
  convidar.mockResolvedValue({
    invitedEmail: "novo@alfa.com",
    role: WorkspaceRole.MEMBER,
    expiresAt: "2026-03-01T00:00:00Z",
  })
  trocarPapel.mockResolvedValue(membro(1))
  desativar.mockResolvedValue({ ...membro(1), active: false })
  remover.mockResolvedValue(undefined)
})

describe("useWorkspaceTeam — listagem", () => {
  it("devolve lista vazia enquanto carrega", () => {
    const { result } = render()

    expect(result.current.members).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it("devolve os membros da conta", async () => {
    listar.mockResolvedValue([membro(1), membro(2, WorkspaceRole.ADMIN)])

    const { result } = render()

    await waitFor(() => expect(result.current.members).toHaveLength(2))
  })

  it("sinaliza erro da consulta", async () => {
    listar.mockRejectedValue(new Error("Erro 500"))

    const { result } = render()

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe("useWorkspaceTeam — convite", () => {
  it("convida e confirma citando o e-mail", async () => {
    const { result } = render()

    await act(async () => {
      await result.current.invite({ email: "novo@alfa.com", role: WorkspaceRole.MEMBER })
    })

    expect(convidar).toHaveBeenCalledWith({ email: "novo@alfa.com", role: WorkspaceRole.MEMBER })
    expect(toast.success).toHaveBeenCalledWith("Convite enviado para novo@alfa.com.")
  })

  it("mostra a mensagem do backend quando o convite falha", async () => {
    convidar.mockRejectedValue(new Error("E-mail já convidado."))
    const { result } = render()

    await act(async () => {
      await result.current
        .invite({ email: "novo@alfa.com", role: WorkspaceRole.MEMBER })
        .catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith("E-mail já convidado.")
  })

  it("cai numa mensagem traduzida quando o erro do convite não tem texto", async () => {
    convidar.mockRejectedValue(new Error(""))
    const { result } = render()

    await act(async () => {
      await result.current
        .invite({ email: "novo@alfa.com", role: WorkspaceRole.MEMBER })
        .catch(() => {})
    })

    expect(toast.error).toHaveBeenCalledWith("Não foi possível enviar o convite.")
  })
})

/**
 * As três ações sobre um membro compartilham o mesmo tratamento de erro e a
 * mesma invalidação — a hierarquia de quem pode fazer o quê é do backend, aqui
 * só se verifica que a ação chega no endpoint certo e a lista recarrega.
 */
describe("useWorkspaceTeam — ações sobre o membro", () => {
  it("troca o papel do membro", async () => {
    const { result } = render()
    listar.mockClear()

    act(() => result.current.changeRole({ memberId: 1, role: WorkspaceRole.ADMIN }))

    await waitFor(() => expect(trocarPapel).toHaveBeenCalledWith(1, WorkspaceRole.ADMIN))
    await waitFor(() => expect(listar).toHaveBeenCalled())
  })

  it("desativa o membro", async () => {
    const { result } = render()

    act(() => result.current.deactivate(1))

    await waitFor(() => expect(desativar).toHaveBeenCalledWith(1))
  })

  it("remove o membro", async () => {
    const { result } = render()

    act(() => result.current.remove(1))

    await waitFor(() => expect(remover).toHaveBeenCalledWith(1))
  })

  it.each([
    ["troca de papel", () => trocarPapel.mockRejectedValue(new Error("ADMIN não gerencia ADMIN."))],
    ["desativação", () => desativar.mockRejectedValue(new Error("ADMIN não gerencia ADMIN."))],
    ["remoção", () => remover.mockRejectedValue(new Error("ADMIN não gerencia ADMIN."))],
  ])("mostra o erro do backend na %s", async (caso, prepara) => {
    prepara()
    const { result } = render()

    act(() => {
      if (caso === "troca de papel") result.current.changeRole({ memberId: 1, role: WorkspaceRole.ADMIN })
      else if (caso === "desativação") result.current.deactivate(1)
      else result.current.remove(1)
    })

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("ADMIN não gerencia ADMIN."))
  })

  it("cai na mensagem traduzida quando o erro da ação não tem texto", async () => {
    remover.mockRejectedValue(new Error(""))
    const { result } = render()

    act(() => result.current.remove(1))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível concluir a ação."))
  })

  // A tabela inteira desabilita durante qualquer ação, para não disparar duas
  // mudanças de papel no mesmo membro.
  it("sinaliza gravação em andamento", async () => {
    let liberar = () => {}
    remover.mockImplementation(() => new Promise((resolve) => { liberar = () => resolve() }))
    const { result } = render()

    act(() => result.current.remove(1))

    await waitFor(() => expect(result.current.isMutating).toBe(true))

    await act(async () => { liberar() })

    await waitFor(() => expect(result.current.isMutating).toBe(false))
  })
})
