export const GlobalRole = {
	ADMIN: "ADMIN",
	ENG: "ENG",
	ARQ: "ARQ",
	USER: "USER",
} as const

export type Role = (typeof GlobalRole)[keyof typeof GlobalRole]

export interface UserProfile {
	id: number
	name: string
	email: string
	role: Role
}
