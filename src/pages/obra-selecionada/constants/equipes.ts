import { RoleInProject, type ConstructionProjectMember, type ProjectRoleInRequest } from "../types/equipes"

/** Papéis que se atribuem a alguém. OWNER vem só de quem criou a obra. */
export const ASSIGNABLE_ROLES: ProjectRoleInRequest[] = [
  RoleInProject.ENGINEER,
  RoleInProject.ARCHITECT,
  RoleInProject.FOREMAN,
  RoleInProject.USER,
]

/** Ordem da lista de pessoas: o responsável primeiro, o cliente por último. */
export const ROLE_ORDER: Record<RoleInProject, number> = {
  OWNER: 0,
  ENGINEER: 1,
  ARCHITECT: 2,
  FOREMAN: 3,
  USER: 4,
}

/** Convite aceito ainda não: a pessoa aparece com o selo "Convite pendente". */
export const MEMBERSHIP_PENDING = "PENDING" satisfies ConstructionProjectMember["membershipStatus"]
