import { api } from "@/lib/api"

export async function resetPassword(token: string, newPassword: string): Promise<void> {
	return api.post<void>("/auth/reset-password", { token, newPassword })
}
