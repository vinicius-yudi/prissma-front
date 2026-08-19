import type { Role } from "@/shared/types/user"

export type { Role, UserProfile } from "@/shared/types/user"

export interface UpdateProfilePayload {
	name?: string
	email?: string
	password?: string
	role?: Role
}
