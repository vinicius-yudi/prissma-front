import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { api, buildHeaders } from "./api"

/**
 * O cliente HTTP é a única porta de saída do front, e é onde moram três
 * decisões que quebram o app inteiro se saírem do lugar: o header de tenant,
 * o logout no 401 e a leitura do corpo de erro. Por isso o `fetch` é mockado
 * aqui em vez de mockar `api` — o alvo do teste É esta camada.
 */

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

/** Payload de token com o claim de workspace, em base64url como o real. */
function tokenComWorkspace(workspaceId: number): string {
  const payload = btoa(JSON.stringify({ workspaceId, workspaceRole: "ADMIN" }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `cabecalho.${payload}.assinatura`
}

const fetchMock = vi.fn()

/** Guarda o `location` original para devolver depois do teste de 401. */
const locationOriginal = window.location

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: locationOriginal,
  })
})

/** Substitui `window.location` por um objeto inerte — jsdom não navega. */
function stubLocation(): { href: string } {
  const fake = { href: "http://localhost/obras" }
  Object.defineProperty(window, "location", { configurable: true, writable: true, value: fake })
  return fake
}

/** Últimos headers enviados ao `fetch`. */
function lastHeaders(): Record<string, string> {
  return fetchMock.mock.calls.at(-1)?.[1].headers as Record<string, string>
}

describe("buildHeaders", () => {
  it("devolve objeto vazio sem token", () => {
    expect(buildHeaders()).toEqual({})
  })

  it("manda Authorization quando há token", () => {
    localStorage.setItem("token", "token-sem-claims")

    expect(buildHeaders()).toEqual({ Authorization: "Bearer token-sem-claims" })
  })

  // O header de tenant é DERIVADO do token. Se ele passar a vir de outro lugar,
  // uma troca de conta pode mandar dados de um workspace com o token de outro.
  it("deriva o X-Workspace-Id do claim do próprio token", () => {
    localStorage.setItem("token", tokenComWorkspace(42))

    expect(buildHeaders()).toEqual({
      Authorization: `Bearer ${tokenComWorkspace(42)}`,
      "X-Workspace-Id": "42",
    })
  })

  it("omite o X-Workspace-Id quando o token não tem o claim", () => {
    localStorage.setItem("token", "token-antigo")

    expect(buildHeaders()["X-Workspace-Id"]).toBeUndefined()
  })
})

describe("api — verbos", () => {
  it("faz GET no caminho prefixado por /api", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1 }))

    const result = await api.get("/projects")

    expect(fetchMock).toHaveBeenCalledWith("/api/projects", expect.objectContaining({ method: "GET" }))
    expect(result).toEqual({ id: 1 })
  })

  it("serializa o corpo do POST em JSON", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 9 }))

    await api.post("/projects", { name: "Residencial Aurora" })

    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ name: "Residencial Aurora" }))
  })

  it("manda PATCH, PUT e DELETE com o método certo", async () => {
    // Uma `Response` só pode ter o corpo lido uma vez, então cada chamada
    // precisa da sua — `mockResolvedValue` devolveria o mesmo objeto três
    // vezes e a segunda leitura estouraria.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({})))

    await api.patch("/projects/1", { name: "novo" })
    await api.put("/projects/1", { name: "novo" })
    await api.delete("/projects/1")

    expect(fetchMock.mock.calls.map((call) => call[1].method)).toEqual(["PATCH", "PUT", "DELETE"])
  })

  // POST sem corpo não pode virar `body: "undefined"` — alguns endpoints (ex.:
  // reenviar convite) não recebem nada e o backend rejeita corpo inválido.
  it("omite o corpo quando não há payload", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await api.post("/invites/1/resend")

    expect(fetchMock.mock.calls[0][1].body).toBeUndefined()
  })

  it("envia Content-Type e os headers de autenticação juntos", async () => {
    localStorage.setItem("token", tokenComWorkspace(7))
    fetchMock.mockResolvedValue(jsonResponse({}))

    await api.get("/projects")

    expect(lastHeaders()).toMatchObject({
      "Content-Type": "application/json",
      "X-Workspace-Id": "7",
    })
  })

  it("deixa o chamador sobrescrever um header", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await api.get("/exports", { headers: { Accept: "text/csv" } })

    expect(lastHeaders().Accept).toBe("text/csv")
  })
})

describe("api — respostas sem corpo", () => {
  it("devolve undefined no 204", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(api.delete("/projects/1")).resolves.toBeUndefined()
  })

  // Um 200 text/plain não pode ir para o `response.json()`: estouraria um erro
  // de parse que o chamador leria como falha da request.
  it("devolve undefined quando a resposta não é JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response("ok", { status: 200, headers: { "content-type": "text/plain" } }),
    )

    await expect(api.get("/health")).resolves.toBeUndefined()
  })

  it("devolve undefined quando não há content-type", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 200 }))

    await expect(api.get("/health")).resolves.toBeUndefined()
  })
})

describe("api — erros", () => {
  it("usa a mensagem do JSON de erro", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "CNPJ já cadastrado." }, 400))

    await expect(api.post("/workspaces", {})).rejects.toThrow("CNPJ já cadastrado.")
  })

  it("usa o corpo cru quando o erro não é JSON", async () => {
    fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }))

    await expect(api.get("/projects")).rejects.toThrow("Bad Gateway")
  })

  it("usa o corpo cru quando o JSON não tem `message`", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ erro: "sem campo message" }, 422))

    await expect(api.get("/projects")).rejects.toThrow('{"erro":"sem campo message"}')
  })

  it("cai no status quando o corpo do erro vem vazio", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }))

    await expect(api.get("/projects")).rejects.toThrow("Erro 500")
  })
})

describe("api — 401", () => {
  it("limpa o token e manda para o login", async () => {
    localStorage.setItem("token", "token-expirado")
    const location = stubLocation()
    fetchMock.mockResolvedValue(new Response("", { status: 401 }))

    await expect(api.get("/projects")).rejects.toThrow("Sessão expirada. Faça login novamente.")
    expect(localStorage.getItem("token")).toBeNull()
    expect(location.href).toBe("/login")
  })

  // Credencial errada no login É um 401 esperado: derrubar a sessão aqui
  // trocaria "senha incorreta" por um redirect para a própria tela de login.
  it("não desloga quando o 401 vem da rota de login", async () => {
    const location = stubLocation()
    fetchMock.mockResolvedValue(jsonResponse({ message: "Credenciais inválidas." }, 401))

    await expect(api.post("/auth/login", {})).rejects.toThrow("Credenciais inválidas.")
    expect(location.href).not.toBe("/login")
  })

  // Listagem só-de-admin devolve 401 por autorização, não por sessão morta.
  it("não desloga quando o chamador pede skipAuthRedirect", async () => {
    localStorage.setItem("token", "token-valido")
    const location = stubLocation()
    fetchMock.mockResolvedValue(jsonResponse({ message: "Sem permissão." }, 401))

    await expect(api.get("/workspaces/members", { skipAuthRedirect: true })).rejects.toThrow(
      "Sem permissão.",
    )
    expect(localStorage.getItem("token")).toBe("token-valido")
    expect(location.href).not.toBe("/login")
  })

  it("não manda skipAuthRedirect adiante para o fetch", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}))

    await api.get("/projects", { skipAuthRedirect: true })

    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("skipAuthRedirect")
  })
})
