import { describe, expect, it } from "vitest"

import { WorkspaceRole } from "@/shared/types/workspace"

import { decodeWorkspaceClaims } from "../jwt"

/**
 * Monta um JWT de mentira: só o payload importa aqui, porque a assinatura é
 * verificada no backend e este módulo nem tenta olhar para ela.
 *
 * O payload é gravado em base64**url** — é assim que o token chega — para que
 * o teste exercite a conversão de '-'/'_' que o `atob` não aceita.
 */
function makeToken(payload: Record<string, unknown>): string {
  const base64url = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `cabecalho.${base64url}.assinatura`
}

describe("decodeWorkspaceClaims", () => {
  it("devolve null sem token", () => {
    expect(decodeWorkspaceClaims(null)).toBeNull()
  })

  it("devolve null para string vazia", () => {
    expect(decodeWorkspaceClaims("")).toBeNull()
  })

  it("devolve null quando o token não tem três partes", () => {
    expect(decodeWorkspaceClaims("token.quebrado")).toBeNull()
  })

  it("devolve null quando o payload não é base64 válido", () => {
    expect(decodeWorkspaceClaims("cabecalho.???.assinatura")).toBeNull()
  })

  it("devolve null quando o payload não é JSON", () => {
    expect(decodeWorkspaceClaims(`cabecalho.${btoa("isto nao e json")}.assinatura`)).toBeNull()
  })

  // Token da fase anterior ao multi-tenant: autentica, mas não escolhe conta.
  // Tratar como null é o que faz o api.ts omitir o header em vez de mandar
  // "undefined" e derrubar a request.
  it("devolve null quando falta o claim de workspace", () => {
    expect(decodeWorkspaceClaims(makeToken({ sub: "1", email: "a@b.com" }))).toBeNull()
  })

  it("devolve null quando workspaceId não é número", () => {
    expect(decodeWorkspaceClaims(makeToken({ workspaceId: "7" }))).toBeNull()
  })

  it("lê os três claims quando o token está completo", () => {
    const token = makeToken({
      workspaceId: 7,
      workspaceRole: WorkspaceRole.ADMIN,
      isOwner: true,
    })

    expect(decodeWorkspaceClaims(token)).toEqual({
      workspaceId: 7,
      workspaceRole: WorkspaceRole.ADMIN,
      isOwner: true,
    })
  })

  // Sem papel declarado o usuário é membro comum — nunca algo mais alto.
  it("assume MEMBER quando o papel não vem no token", () => {
    expect(decodeWorkspaceClaims(makeToken({ workspaceId: 7 }))?.workspaceRole).toBe(
      WorkspaceRole.MEMBER,
    )
  })

  it("só marca isOwner com o booleano true, não com valor truthy", () => {
    expect(decodeWorkspaceClaims(makeToken({ workspaceId: 7, isOwner: "sim" }))?.isOwner).toBe(false)
    expect(decodeWorkspaceClaims(makeToken({ workspaceId: 7 }))?.isOwner).toBe(false)
  })

  it("decodifica payload cujo base64 precisa de padding", () => {
    // Payloads de tamanhos diferentes caem em restos diferentes na divisão por
    // 4; o `padEnd` do módulo é o que cobre todos, então varia-se o tamanho.
    for (const nome of ["a", "ab", "abc", "abcd"]) {
      expect(decodeWorkspaceClaims(makeToken({ workspaceId: 1, nome }))?.workspaceId).toBe(1)
    }
  })
})
