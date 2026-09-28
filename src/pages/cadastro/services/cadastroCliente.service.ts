import { api } from "@/lib/api"
import { GlobalRole } from "@/shared/types/user"
import type { CadastroFormDataCliente } from "../types"

interface CadastroResponse {
  token: string
}

export async function cadastroCliente(data: CadastroFormDataCliente): Promise<CadastroResponse> {
  const { confirmPassword, ...dataToSend } = data
  const cadastroData = { ...dataToSend, role: GlobalRole.USER }
  return api.post<CadastroResponse>("/users", cadastroData)
}