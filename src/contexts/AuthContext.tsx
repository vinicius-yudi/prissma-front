import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createContext, useCallback, useContext, useMemo, useState } from "react"

import { decodeWorkspaceClaims, type WorkspaceClaims } from "@/lib/jwt"
import { getMyProfile } from "@/shared/services/user.service"
import type { UserProfile } from "@/shared/types/user"

interface AuthContextValue {
  token: string | null
  isAuthenticated: boolean
  /** Usuário logado. `null` enquanto carrega ou quando não há sessão. */
  user: UserProfile | null
  /**
   * Workspace ativo, decodificado DO PRÓPRIO token (claims). Não é estado
   * paralelo: muda somente quando um token novo é gravado (login/switch), e
   * é o mesmo valor que o api.ts manda no X-Workspace-Id. `null` para token
   * antigo (rollout) ou membro puro sem conta.
   */
  activeWorkspace: WorkspaceClaims | null
  isLoadingUser: boolean
  saveToken: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"))
  const queryClient = useQueryClient()

  // O shell inteiro depende de saber quem está logado: a sidebar é gerada do
  // papel, e o guard de rota decide a partir dele. Guardar só o token não
  // basta.
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["me"],
    queryFn: getMyProfile,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  })

  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("token")
    setToken(null)
    // Sem isto o próximo login herda o perfil e as listas do usuário anterior.
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: !!token,
      user: user ?? null,
      activeWorkspace: decodeWorkspaceClaims(token),
      isLoadingUser: !!token && isLoadingUser,
      saveToken,
      logout,
    }),
    [token, user, isLoadingUser, saveToken, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  return ctx
}
