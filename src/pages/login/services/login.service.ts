import { api } from "@/lib/api"
import type { LoginFormData } from "../types"

interface LoginResponse {
  token: string
}

export async function login(credentials: LoginFormData): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", credentials)
}
