import { api } from "@/lib/api"
import { GlobalRole } from "@/shared/types/user"
import type { CadastroFormDataArquiteto } from "../types"

interface CadastroResponse {
  token: string
}

export async function cadastroArquiteto(data: CadastroFormDataArquiteto): Promise<CadastroResponse> {
  const { confirmPassword, ...dataToSend } = data
  const cadastroData = { ...dataToSend, role: GlobalRole.ARQ }
  return api.post<CadastroResponse>("/users", cadastroData)
}