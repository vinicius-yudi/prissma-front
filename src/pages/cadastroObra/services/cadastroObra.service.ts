import { api } from "@/lib/api"
import type { CadastroFormDataObra } from "../types"

export async function cadastroObra(data: CadastroFormDataObra): Promise<void> {
  return api.post<void>("/projects", data)
}