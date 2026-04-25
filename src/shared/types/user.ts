export type Role = "ENG" | "USER"

export interface UserProfile {
	id: number
	name: string
	email: string
	role: Role
}
