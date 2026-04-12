import { api } from "@/lib/api"
import type { CadastroFormDataCliente } from "../types"

interface CadastroResponse {
  token: string
}

export async function cadastroCliente(data: CadastroFormDataCliente): Promise<CadastroResponse> {
  const { confirmPassword, ...dataToSend } = data
  const cadastroData = { ...dataToSend, role: 'USER' as const }
  return api.post<CadastroResponse>("/users", cadastroData)
}