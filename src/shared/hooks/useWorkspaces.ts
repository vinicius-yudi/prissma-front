import { useMutation, useQuery } from "@tanstack/react-query"

import { useAuth } from "@/contexts/AuthContext"
import { createWorkspace, getWorkspaces, switchWorkspace } from "@/shared/services/workspace.service"

/**
 * Lista de workspaces do usuário + troca de conta.
 *
 * O switch grava o token novo (que carrega os claims do workspace alvo) e dá
 * `window.location.reload()`: recarregar invalida TODO o cache do TanStack
 * Query de uma vez — o caminho pragmático para nenhum dado da conta anterior
 * sobreviver à troca.
 */
export function useWorkspaces() {
  const { saveToken, isAuthenticated } = useAuth()

  const workspacesQuery = useQuery({
    queryKey: ["workspaces"],
    queryFn: getWorkspaces,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  })

  const switchMutation = useMutation({
    mutationFn: switchWorkspace,
    onSuccess: ({ token }) => {
      saveToken(token)
      window.location.reload()
    },
  })

  const createMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: (workspace) => {
      // Conta nova já nasce ativa: reaproveita o switch para trocar o token.
      switchMutation.mutate(workspace.id)
    },
  })

  return {
    workspaces: workspacesQuery.data ?? [],
    isLoading: workspacesQuery.isLoading,
    switchTo: switchMutation.mutate,
    isSwitching: switchMutation.isPending,
    create: createMutation.mutate,
    isCreating: createMutation.isPending || switchMutation.isPending,
    createError: createMutation.error,
  }
}
