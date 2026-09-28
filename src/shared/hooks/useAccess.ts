import { useLocation } from "react-router-dom"

import { useProjectPermissions } from "@/pages/obra-selecionada/hooks/useProjectPermissions"
import { useAuth } from "@/contexts/AuthContext"
import {
  accessTo,
  isObraModule,
  profileFromGlobalRole,
  profileFromProjectRole,
  profileFromWorkspaceRole,
  type AccessLevel,
  type AppModule,
  type Profile,
} from "@/shared/constants/access"

/**
 * Resolve o perfil vigente e o acesso a cada módulo.
 *
 * O papel é **por obra**: dentro de uma obra o perfil vem do vínculo do
 * usuário com ela; fora, do papel global da conta. Este hook é o único lugar
 * que faz essa escolha — sidebar, header e guards todos consultam ele, para
 * não divergirem entre si.
 */

export interface UseAccessResult {
  profile: Profile | null
  /** Obra aberta, ou null no nível de workspace. */
  obraId: number | null
  isLoading: boolean
  levelOf: (module: AppModule) => AccessLevel
  canSee: (module: AppModule) => boolean
  isReadOnly: (module: AppModule) => boolean
}

/**
 * Obra aberta, lida da URL.
 *
 * Não dá para usar `useParams` aqui: a sidebar e o header vivem no
 * <MainLayout>, que é **ancestral** da rota `obras/:obraId` — e `useParams` só
 * enxerga os params casados até o próprio nível. Ler o pathname funciona em
 * qualquer profundidade. Quando o prefixo `/w/:wsId` entrar, é este padrão que
 * muda, num lugar só.
 */
const OBRA_PATH = /^\/obras\/(\d+)(?:\/|$)/

export function useObraIdFromPath(): number | null {
  const { pathname } = useLocation()
  const match = OBRA_PATH.exec(pathname)
  return match ? Number(match[1]) : null
}

/**
 * Módulo aberto, derivado da URL. É o que permite ao header saber se deve
 * mostrar o aviso de somente-leitura sem cada tela ter de informá-lo.
 */
export function useCurrentModule(): AppModule | null {
  const { pathname } = useLocation()

  const obra = OBRA_PATH.exec(pathname)
  if (obra) {
    const segment = pathname.slice(obra[0].length).split("/")[0]
    return isObraModule(segment) ? segment : null
  }

  if (pathname.startsWith("/dashboard")) return "home"
  if (pathname.startsWith("/obras")) return "obras"
  return null
}

export function useAccess(): UseAccessResult {
  const { user, activeWorkspace, isLoadingUser } = useAuth()
  const obraId = useObraIdFromPath()

  const { roleInProject, isAdmin, isLoading: isLoadingRole } = useProjectPermissions(obraId ?? 0)

  // ADMIN global passa por cima do vínculo — do contrário um admin que não é
  // membro da obra veria "Acesso negado" em todos os módulos dela, que é
  // exatamente o oposto do que o papel significa no backend.
  const obraProfile = isAdmin ? "engenheiro" : profileFromProjectRole(roleInProject)

  // Nível 1: o perfil vem do papel NA CONTA (claim do token). O papel global
  // fica de fallback para staff e para tokens antigos do rollout.
  const workspaceProfile =
    profileFromWorkspaceRole(activeWorkspace?.workspaceRole) ?? profileFromGlobalRole(user?.role)

  const profile: Profile | null = obraId ? obraProfile : workspaceProfile

  const isLoading = isLoadingUser || (obraId !== null && isLoadingRole)

  function levelOf(module: AppModule): AccessLevel {
    // Módulo de obra fora de uma obra não existe: não há papel para consultar.
    if (isObraModule(module) && obraId === null) return ""
    return accessTo(profile, module)
  }

  return {
    profile,
    obraId,
    isLoading,
    levelOf,
    canSee: (module) => levelOf(module) !== "",
    isReadOnly: (module) => levelOf(module) === "r",
  }
}
