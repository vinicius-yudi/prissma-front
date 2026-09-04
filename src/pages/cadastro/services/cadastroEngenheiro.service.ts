import { api } from "@/lib/api"
import { GlobalRole } from "@/shared/types/user"
import type { CadastroFormDataEngenheiro } from "../types"

interface CadastroResponse {
  token: string
}

export async function cadastroEngenheiro(data: CadastroFormDataEngenheiro): Promise<CadastroResponse> {
  const { confirmPassword, ...dataToSend } = data
  const cadastroData = { ...dataToSend, role: GlobalRole.ENG }
  return api.post<CadastroResponse>("/users", cadastroData)
}

