import type { LoginFormData } from "../types"

export async function login(credentials: LoginFormData): Promise<void> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error("Credenciais inválidas")
  }
}
