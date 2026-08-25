import type { RoleInProject } from "@/pages/obra-selecionada/types/equipes"
import { GlobalRole, type Role } from "@/shared/types/user"

/**
 * Matriz Papel × Módulo — fonte única de acesso da interface.
 *
 * Copiada do protótipo `PRISSMA App.dc.html` e da matriz de Fluxos v2 §3.
 * Este mapa alimenta **quatro coisas ao mesmo tempo**: a geração da sidebar, o
 * 👁 no item, o aviso de somente-leitura no header e o guard de rota. Elas
 * divergirem entre si é o modo clássico de vazar acesso — por isso um mapa só.
 *
 * Regras (Fluxos v2 §3):
 * - `"w"` edita · `"r"` só lê (item ganha 👁 + aviso) · `""` nem aparece na nav
 * - acesso direto a módulo sem permissão → tela "Acesso negado"
 */

export const WORKSPACE_MODULES = ["home", "obras", "agenda", "relatorios"] as const

/**
 * "Pessoas & papéis" aparece no nível de workspace no design, porque o design
 * pressupõe a entidade Workspace. Enquanto ela não existe, o vínculo é por
 * obra (`construction_project_members`) — então o módulo vive no nível 2, onde
 * os dados realmente estão. Volta para o nível 1 junto com o Workspace.
 */
export const OBRA_MODULES = [
  "visao-geral",
  "indicadores",
  "etapas",
  "tarefas",
  "equipes",
  "orcamento",
  "diario",
  "documentos",
  "propostas",
  "pessoas",
] as const

export type WorkspaceModule = (typeof WORKSPACE_MODULES)[number]
export type ObraModule = (typeof OBRA_MODULES)[number]
export type AppModule = WorkspaceModule | ObraModule

export type AccessLevel = "w" | "r" | ""

/**
 * Os quatro perfis do design. O papel é **por obra** — o mesmo usuário é
 * engenheiro numa e cliente em outra —, então dentro de uma obra o perfil vem
 * do vínculo; fora dela, do papel global da conta.
 */
export type Profile = "engenheiro" | "arquiteto" | "cliente" | "mestre"

type ModuleAccess = Record<AppModule, AccessLevel>

export const ACCESS: Record<Profile, ModuleAccess> = {
  engenheiro: {
    home: "w", obras: "w", agenda: "w", relatorios: "w", pessoas: "w",
    "visao-geral": "w", indicadores: "w", etapas: "w", tarefas: "w",
    equipes: "w", orcamento: "w", diario: "w", documentos: "w", propostas: "w",
  },
  arquiteto: {
    home: "w", obras: "w", agenda: "w", relatorios: "r", pessoas: "",
    "visao-geral": "w", indicadores: "r", etapas: "r", tarefas: "w",
    equipes: "r", orcamento: "", diario: "w", documentos: "w", propostas: "w",
  },
  cliente: {
    home: "w", obras: "w", agenda: "", relatorios: "r", pessoas: "",
    "visao-geral": "r", indicadores: "r", etapas: "r", tarefas: "",
    equipes: "", orcamento: "r", diario: "r", documentos: "r", propostas: "r",
  },
  mestre: {
    home: "w", obras: "w", agenda: "w", relatorios: "", pessoas: "",
    "visao-geral": "w", indicadores: "r", etapas: "r", tarefas: "w",
    equipes: "r", orcamento: "", diario: "w", documentos: "w", propostas: "",
  },
}

/** Papel dentro de uma obra → perfil do design. OWNER manda como engenheiro. */
const PROFILE_BY_PROJECT_ROLE: Record<RoleInProject, Profile> = {
  OWNER: "engenheiro",
  ENGINEER: "engenheiro",
  ARCHITECT: "arquiteto",
  FOREMAN: "mestre",
  USER: "cliente",
}

/** Papel global da conta → perfil, para os módulos de workspace. */
const PROFILE_BY_GLOBAL_ROLE: Record<Role, Profile> = {
  [GlobalRole.ADMIN]: "engenheiro",
  [GlobalRole.ENG]: "engenheiro",
  [GlobalRole.ARQ]: "arquiteto",
  [GlobalRole.USER]: "cliente",
}

export function profileFromProjectRole(role: RoleInProject | null | undefined): Profile | null {
  return role ? PROFILE_BY_PROJECT_ROLE[role] : null
}

export function profileFromGlobalRole(role: Role | null | undefined): Profile {
  return role ? PROFILE_BY_GLOBAL_ROLE[role] : "cliente"
}

export function accessTo(profile: Profile | null, module: AppModule): AccessLevel {
  if (!profile) return ""
  return ACCESS[profile][module]
}

export function isObraModule(module: string): module is ObraModule {
  return (OBRA_MODULES as readonly string[]).includes(module)
}
