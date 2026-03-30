import type { CadastroFormDataArquiteto } from "../types"

export async function cadastroArquiteto(data: CadastroFormDataArquiteto): Promise<void> {
  const response = await fetch("/api/auth/cadastro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Não foi possível realizar o cadastro")
  }
}