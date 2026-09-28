import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHookWrapper } from "@/test/renderWithProviders"

import {
  ProjectPermission,
  ProjectRole,
  getRolePermissions,
  updateRolePermissions,
} from "../../services/projectPermissions.service"
import { rolePermissionsKey, useUpdateRolePermissions } from "../useRolePermissions"

vi.mock("../../services/projectPermissions.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/projectPermissions.service")>()),
  getRolePermissions: vi.fn(),
  updateRolePermissions: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const buscar = vi.mocked(getRolePermissions)
const salvar = vi.mocked(updateRolePermissions)

const PERMISSOES = [ProjectPermission.VIEW_PROJECT, ProjectPermission.MANAGE_TASKS]

function render(projectId = 7) {
  return renderHook(() => useUpdateRolePermissions(projectId), { wrapper: createHookWrapper() })
}

beforeEach(() => {
  vi.resetAllMocks()
  buscar.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: [] })
  salvar.mockResolvedValue({ role: ProjectRole.ENGINEER, permissions: PERMISSOES })
})

// A chave é montada em dois lugares (a consulta e a invalidação depois de
// salvar); escrita à mão nos dois, um typo deixaria a tela com dado velho.
describe("rolePermissionsKey", () => {
  it("inclui obra e papel, para não misturar duas obras em cache", () => {
    expect(rolePermissionsKey(7, ProjectRole.ENGINEER)).toEqual([
      "rolePermissions",
      7,
      ProjectRole.ENGINEER,
    ])
  })
})

describe("useUpdateRolePermissions", () => {
  it("grava a lista completa de permissões do papel", async () => {
    const { result } = render()

    act(() => result.current.updatePermissions({ role: ProjectRole.FOREMAN, permissions: PERMISSOES }))

    await waitFor(() =>
      expect(salvar).toHaveBeenCalledWith(7, ProjectRole.FOREMAN, PERMISSOES),
    )
    expect(toast.success).toHaveBeenCalledWith("Permissões atualizadas com sucesso!")
  })

  it("expõe a versão async, que o editor aguarda para fechar", async () => {
    const { result } = render()

    await act(async () => {
      await result.current.updatePermissionsAsync({
        role: ProjectRole.ENGINEER,
        permissions: [],
      })
    })

    expect(salvar).toHaveBeenCalledWith(7, ProjectRole.ENGINEER, [])
  })

  it("mostra a mensagem do backend quando a gravação falha", async () => {
    salvar.mockRejectedValue(new Error("Papel do dono é imutável."))
    const { result } = render()

    act(() => result.current.updatePermissions({ role: ProjectRole.OWNER, permissions: [] }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Papel do dono é imutável."))
  })

  it("cai numa mensagem própria quando o erro não tem texto", async () => {
    salvar.mockRejectedValue(new Error(""))
    const { result } = render()

    act(() => result.current.updatePermissions({ role: ProjectRole.ENGINEER, permissions: [] }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao atualizar permissões"))
  })

  it("sinaliza a gravação em andamento", async () => {
    let liberar = () => {}
    salvar.mockImplementation(
      () =>
        new Promise((resolve) => {
          liberar = () => resolve({ role: ProjectRole.ENGINEER, permissions: [] })
        }),
    )
    const { result } = render()

    act(() => result.current.updatePermissions({ role: ProjectRole.ENGINEER, permissions: [] }))

    await waitFor(() => expect(result.current.isUpdating).toBe(true))

    await act(async () => { liberar() })

    await waitFor(() => expect(result.current.isUpdating).toBe(false))
  })
})
