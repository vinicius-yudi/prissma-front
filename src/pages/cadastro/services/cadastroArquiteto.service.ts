import { api } from "@/lib/api"
import type { CadastroFormDataArquiteto } from "../types"

interface CadastroResponse {
  token: string
}

export async function cadastroArquiteto(data: CadastroFormDataArquiteto): Promise<CadastroResponse> {
  const { confirmPassword, ...dataToSend } = data
  const cadastroData = { ...dataToSend, role: 'arquiteto' as const }
  return api.post<CadastroResponse>("/users", cadastroData)
}