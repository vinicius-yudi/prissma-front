/** Papel GLOBAL da conta do usuário. Espelha o enum Role do backend. */
export const GlobalRole = {
	ADMIN: "ADMIN",
	ENG: "ENG",
	ARQ: "ARQ",
	USER: "USER",
} as const

export type Role = (typeof GlobalRole)[keyof typeof GlobalRole]

/** Cliente da obra: cadastro sem atribuição técnica. */
export function isClientRole(role: Role): boolean {
	return role === GlobalRole.USER
}

/**
 * Colaborador técnico (engenheiro/arquiteto): quem compõe a equipe da obra e
 * pode ser responsável por tarefas. ADMIN é staff da plataforma, não equipe.
 */
export function isCollaboratorRole(role: Role): boolean {
	return role === GlobalRole.ENG || role === GlobalRole.ARQ
}

export interface UserProfile {
	id: number
	name: string
	email: string
	role: Role
}
