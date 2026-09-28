import { api, buildHeaders } from "@/lib/api"

import type {
  PreviewJob,
  PreviewOptions,
  Proposal,
  ProposalPage,
  ProposalPayload,
  ProposalVersion,
} from "../types/proposal"

const BASE_URL = "/api"

export class ProposalRequestError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ProposalRequestError"
    this.status = status
  }
}

/**
 * O `api` de lib/api não serve para estas rotas: ele força
 * `Content-Type: application/json`, serializa o corpo e descarta qualquer
 * resposta que não seja JSON. Aqui há multipart na ida e PNG na volta, então o
 * `fetch` é cru — com os mesmos headers de auth e tenant, senão a requisição
 * vaza para o workspace errado depois de uma troca de conta.
 */
function proposalsUrl(projectId: number, suffix = ""): string {
  return `${BASE_URL}/projects/${projectId}/proposals${suffix}`
}

async function handleRawResponse(response: Response): Promise<void> {
  if (response.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/login"
    throw new ProposalRequestError(401, "Sessão expirada. Faça login novamente.")
  }

  if (!response.ok) {
    // O backend responde text/plain nos erros; só as falhas de @Valid vêm em JSON.
    let message = `Erro ${response.status}`
    const text = await response.text()
    if (text) {
      try {
        const data = JSON.parse(text) as { message?: string }
        message = data.message ?? text
      } catch {
        message = text
      }
    }
    throw new ProposalRequestError(response.status, message)
  }
}

/**
 * Anexa um objeto como parte JSON de verdade.
 *
 * `FormData.append(nome, JSON.stringify(x))` manda a parte como `text/plain` e
 * o `@RequestPart` do Spring responde 415. O Blob com tipo é o que faz o
 * servidor desserializar.
 */
function jsonPart(value: unknown): Blob {
  return new Blob([JSON.stringify(value)], { type: "application/json" })
}

export async function listProposals(projectId: number): Promise<ProposalPage> {
  return api.get<ProposalPage>(`/projects/${projectId}/proposals`)
}

export async function getProposal(projectId: number, proposalId: number): Promise<Proposal> {
  return api.get<Proposal>(`/projects/${projectId}/proposals/${proposalId}`)
}

export async function createProposal(
  projectId: number,
  payload: ProposalPayload,
  file?: File | null,
): Promise<Proposal> {
  const formData = new FormData()
  formData.append("proposal", jsonPart(payload))
  if (file) {
    formData.append("file", file)
  }

  const response = await fetch(proposalsUrl(projectId), {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  })

  await handleRawResponse(response)
  return response.json() as Promise<Proposal>
}

export async function updateProposal(
  projectId: number,
  proposalId: number,
  payload: ProposalPayload,
): Promise<Proposal> {
  return api.patch<Proposal>(`/projects/${projectId}/proposals/${proposalId}`, payload)
}

export async function deleteProposal(projectId: number, proposalId: number): Promise<void> {
  return api.delete<void>(`/projects/${projectId}/proposals/${proposalId}`)
}

export async function addProposalVersion(
  projectId: number,
  proposalId: number,
  file: File,
  description?: string,
): Promise<ProposalVersion> {
  const formData = new FormData()
  formData.append("file", file)

  const query = description ? `?description=${encodeURIComponent(description)}` : ""
  const response = await fetch(proposalsUrl(projectId, `/${proposalId}/versions${query}`), {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  })

  await handleRawResponse(response)
  return response.json() as Promise<ProposalVersion>
}

export async function changeVersionStatus(
  projectId: number,
  proposalId: number,
  versionId: number,
  status: string,
  comment?: string,
): Promise<ProposalVersion> {
  return api.patch<ProposalVersion>(
    `/projects/${projectId}/proposals/${proposalId}/versions/${versionId}/status`,
    { status, comment },
  )
}

/**
 * Baixa a imagem da versão como blob.
 *
 * Não dá para apontar um `<img src>` direto para a rota: ela exige
 * `Authorization` e `X-Workspace-Id`, e a tag não manda header nenhum.
 */
export async function fetchVersionImage(
  projectId: number,
  proposalId: number,
  versionId: number,
): Promise<Blob> {
  const response = await fetch(
    proposalsUrl(projectId, `/${proposalId}/versions/${versionId}/image`),
    { headers: buildHeaders() },
  )

  await handleRawResponse(response)
  return response.blob()
}

/** Dispara a prévia. Responde 202 — a geração continua depois da requisição. */
export async function requestPreview(
  projectId: number,
  proposalId: number,
  rawImage: File,
  floorPlan: File | null,
  options: PreviewOptions,
): Promise<PreviewJob> {
  const formData = new FormData()
  formData.append("rawImage", rawImage)
  if (floorPlan) {
    formData.append("floorPlan", floorPlan)
  }
  formData.append("options", jsonPart(options))

  const response = await fetch(proposalsUrl(projectId, `/${proposalId}/previews`), {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  })

  await handleRawResponse(response)
  return response.json() as Promise<PreviewJob>
}

export async function getPreview(
  projectId: number,
  proposalId: number,
  previewId: number,
): Promise<PreviewJob> {
  return api.get<PreviewJob>(
    `/projects/${projectId}/proposals/${proposalId}/previews/${previewId}`,
  )
}
