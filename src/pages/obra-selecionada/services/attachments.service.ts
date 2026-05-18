import { api } from "@/lib/api"
import type { Attachment } from "@/shared/types/attachment"

const BASE_URL = "/api"

function buildAuthHeader(): HeadersInit {
  const token = localStorage.getItem("token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function handleRawResponse(response: Response): Promise<void> {
  if (response.status === 401) {
    localStorage.removeItem("token")
    window.location.href = "/login"
    throw new Error("Sessão expirada. Faça login novamente.")
  }

  if (!response.ok) {
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
    throw new Error(message)
  }
}

export async function listAttachments(projectId: number): Promise<Attachment[]> {
  return api.get<Attachment[]>(`/projects/${projectId}/attachments`)
}

export async function uploadAttachment(projectId: number, file: File): Promise<Attachment> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("target", "PROJECT")

  const response = await fetch(`${BASE_URL}/projects/${projectId}/attachments`, {
    method: "POST",
    headers: buildAuthHeader(),
    body: formData,
  })

  await handleRawResponse(response)
  return response.json() as Promise<Attachment>
}

export interface DownloadResult {
  blob: Blob
  fileName: string
}

export async function downloadAttachment(projectId: number, id: number): Promise<DownloadResult> {
  const response = await fetch(
    `${BASE_URL}/projects/${projectId}/attachments/${id}/download`,
    { headers: buildAuthHeader() },
  )

  await handleRawResponse(response)

  const blob = await response.blob()
  const disposition = response.headers.get("Content-Disposition")
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?(.+)/i)
  const fileName = match ? decodeURIComponent(match[1].replace(/['"]/g, "")) : "arquivo"

  return { blob, fileName }
}

export async function deleteAttachment(projectId: number, id: number): Promise<void> {
  return api.delete<void>(`/projects/${projectId}/attachments/${id}`)
}

export function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
