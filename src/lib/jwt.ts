/**
 * Decodificação do payload do JWT — sem verificação de assinatura, que é
 * responsabilidade exclusiva do backend. O front só LÊ claims para saber qual
 * workspace está ativo; o gate real é o servidor.
 *
 * O workspace ativo É o claim do token (não um estado paralelo): o header
 * `X-Workspace-Id` enviado pelo api.ts é derivado do mesmo token que autentica
 * a request, então os dois nunca divergem e a escolha sobrevive a reload.
 */

import { WorkspaceRole } from "@/shared/types/workspace"

export interface WorkspaceClaims {
  workspaceId: number
  workspaceRole: WorkspaceRole
  isOwner: boolean
}

function decodePayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  try {
    // base64url -> base64 (o atob não aceita '-' e '_')
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Claims de workspace do token, ou null (token antigo/inválido/membro puro sem conta). */
export function decodeWorkspaceClaims(token: string | null): WorkspaceClaims | null {
  if (!token) return null
  const payload = decodePayload(token)
  if (!payload || typeof payload.workspaceId !== "number") return null
  return {
    workspaceId: payload.workspaceId,
    workspaceRole: (payload.workspaceRole as WorkspaceRole) ?? WorkspaceRole.MEMBER,
    isOwner: payload.isOwner === true,
  }
}
