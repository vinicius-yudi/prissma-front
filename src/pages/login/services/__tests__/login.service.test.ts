import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import { login } from "../login.service"

// O cliente HTTP é a fronteira da unidade: o service só existe para escolher a
// rota e repassar o payload. Mockar `@/lib/api` mantém o teste sem rede e ainda
// pega o erro que mais dói aqui — mudar a rota sem querer.
vi.mock("@/lib/api", () => ({
  api: { post: vi.fn() },
}))

const postMock = vi.mocked(api.post)

describe("login service", () => {
  beforeEach(() => {
    postMock.mockReset()
  })

  it("faz POST em /auth/login com as credenciais recebidas", async () => {
    postMock.mockResolvedValue({ token: "jwt-de-teste" })
    const credentials = { email: "obra@prissma.com", password: "senha123" }

    await login(credentials)

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith("/auth/login", credentials)
  })

  it("devolve o corpo da resposta sem transformar", async () => {
    postMock.mockResolvedValue({ token: "jwt-de-teste" })

    const result = await login({ email: "obra@prissma.com", password: "senha123" })

    expect(result).toEqual({ token: "jwt-de-teste" })
  })

  it("propaga o erro do cliente HTTP", async () => {
    postMock.mockRejectedValue(new Error("Invalid credentials"))

    await expect(login({ email: "obra@prissma.com", password: "errada" })).rejects.toThrow(
      "Invalid credentials",
    )
  })
})
