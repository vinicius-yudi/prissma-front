import { api } from "@/lib/api"

export async function forgotPassword(email: string): Promise<void> {
	return api.post<void>("/auth/forgot-password", { email })
}
