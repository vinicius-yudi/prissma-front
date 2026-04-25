import { api } from "@/lib/api"
import type { UserProfile } from "@/shared/types/user"

export async function getMyProfile(): Promise<UserProfile> {
	return api.get<UserProfile>("/users/me")
}
