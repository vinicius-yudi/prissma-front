import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import { forgotPassword } from "@/pages/forgot-password/services/forgot-password.service"
import { resetPassword } from "@/pages/reset-password/services/reset-password.service"
import { deleteAccount, updateProfile } from "@/pages/perfil/services/perfil.service"
import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole } from "@/shared/types/user"

import { cadastroArquiteto } from "./cadastroArquiteto.service"
import { cadastroCliente } from "./cadastroCliente.service"
import { cadastroEngenheiro } from "./cadastroEngenheiro.service"

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

const formulario = {
  name: "Ana Souza",
  email: "ana@construtora.com",
  password: "Obra@2026",
  confirmPassword: "Obra@2026",
}

/**
 * Os três cadastros compartilham a mesma rota e só divergem no papel enviado.
 * A tabela deixa a única diferença explícita — se um deles passar a mandar o
 * papel errado, é aqui que aparece, e não numa conta criada com permissão
 * demais.
 */
describe.each([
  ["cliente", cadastroCliente, GlobalRole.USER],
  ["arquiteto", cadastroArquiteto, GlobalRole.ARQ],
  ["engenheiro", cadastroEngenheiro, GlobalRole.ENG],
] as const)("cadastro de %s", (_perfil, cadastrar, papel) => {
  it("posta em /users com o papel do perfil", async () => {
    post.mockResolvedValue({ token: "jwt" })

    await cadastrar(formulario)

    expect(post).toHaveBeenCalledWith("/users", {
      name: formulario.name,
      email: formulario.email,
      password: formulario.password,
      role: papel,
    })
  })

  // A confirmação é validação de tela: mandá-la adiante daria ao backend um
  // campo que ele não conhece, e vazaria a senha uma segunda vez no corpo.
  it("não manda a confirmação de senha", async () => {
    post.mockResolvedValue({ token: "jwt" })

    await cadastrar(formulario)

    expect(post.mock.calls[0][1]).not.toHaveProperty("confirmPassword")
  })

  it("devolve o token da resposta", async () => {
    post.mockResolvedValue({ token: "jwt-novo" })

    await expect(cadastrar(formulario)).resolves.toEqual({ token: "jwt-novo" })
  })
})

describe("perfil", () => {
  it("lê o próprio perfil", async () => {
    get.mockResolvedValue({ id: 1 })

    await getMyProfile()

    expect(get).toHaveBeenCalledWith("/users/me")
  })

  it("edita e exclui a conta pelo id do usuário", async () => {
    patch.mockResolvedValue({ id: 1 })
    del.mockResolvedValue(undefined)

    await updateProfile(1, { name: "Ana Souza Lima" })
    await deleteAccount(1)

    expect(patch).toHaveBeenCalledWith("/users/1", { name: "Ana Souza Lima" })
    expect(del).toHaveBeenCalledWith("/users/1")
  })
})

describe("recuperação de senha", () => {
  it("pede o e-mail de recuperação", async () => {
    post.mockResolvedValue(undefined)

    await forgotPassword("ana@construtora.com")

    expect(post).toHaveBeenCalledWith("/auth/forgot-password", { email: "ana@construtora.com" })
  })

  // O token vai no CORPO, não no caminho: ele é de uso único e não deve
  // aparecer em log de acesso de proxy.
  it("troca a senha mandando token e senha nova no corpo", async () => {
    post.mockResolvedValue(undefined)

    await resetPassword("tok-123", "Nova@2026")

    expect(post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "tok-123",
      newPassword: "Nova@2026",
    })
  })
})
