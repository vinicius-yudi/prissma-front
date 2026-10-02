import { api } from "@/lib/api"
import type { LoginFormSchema } from "../schemas/login.schema"

interface LoginResponse {
  token: string
}

export async function login(credentials: LoginFormSchema): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", credentials)
}
