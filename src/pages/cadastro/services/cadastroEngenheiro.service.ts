import { api } from "@/lib/api"
import type { CadastroFormDataEngenheiro } from "../types"

interface CadastroResponse {
  token: string
}

export async function cadastroEngenheiro(data: CadastroFormDataEngenheiro): Promise<CadastroResponse> {
  const { confirmPassword, ...dataToSend } = data
  const cadastroData = { ...dataToSend, role: 'ENG' as const }
  return api.post<CadastroResponse>("/users", cadastroData)
}

