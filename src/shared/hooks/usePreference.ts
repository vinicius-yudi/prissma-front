import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  deletePreference,
  getPreference,
  putPreference,
  type Preference,
  type PreferenceKey,
} from "@/shared/services/preferences.service"

export function preferenceQueryKey(key: PreferenceKey) {
  return ["preferences", key] as const
}

export interface UsePreferenceResult<T> {
  /** Valor salvo, ou `null` se nunca salvou (use o padrão da tela). */
  value: T | null
  isLoading: boolean
  isError: boolean
  isSaving: boolean
  save: (value: T) => Promise<void>
  reset: () => Promise<void>
}

/**
 * Lê e grava uma preferência de interface do usuário logado.
 *
 * A gravação é otimista: a tela já mostra o novo valor e, se o servidor
 * recusar, volta ao anterior — quem chama decide a mensagem (a promessa
 * rejeita). O logout limpa o cache inteiro (AuthContext), então a preferência
 * de um usuário nunca aparece para o próximo na mesma aba.
 */
export function usePreference<T>(key: PreferenceKey): UsePreferenceResult<T> {
  const queryClient = useQueryClient()
  const queryKey = preferenceQueryKey(key)

  const query = useQuery({
    queryKey,
    queryFn: () => getPreference<T>(key),
    // Só muda quando o próprio usuário salva, e o save já atualiza o cache.
    staleTime: Infinity,
  })

  const saveMutation = useMutation({
    mutationFn: (value: T) => putPreference<T>(key, value),
    onMutate: async (value: T) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Preference<T> | null>(queryKey)
      queryClient.setQueryData<Preference<T> | null>(queryKey, {
        key,
        value,
        updatedAt: previous?.updatedAt ?? new Date().toISOString(),
      })
      return { previous }
    },
    onError: (_error, _value, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null)
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved)
    },
  })

  const resetMutation = useMutation({
    mutationFn: () => deletePreference(key),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Preference<T> | null>(queryKey)
      queryClient.setQueryData(queryKey, null)
      return { previous }
    },
    onError: (_error, _value, context) => {
      queryClient.setQueryData(queryKey, context?.previous ?? null)
    },
  })

  return {
    value: query.data?.value ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isSaving: saveMutation.isPending || resetMutation.isPending,
    save: async (value) => {
      await saveMutation.mutateAsync(value)
    },
    reset: async () => {
      await resetMutation.mutateAsync()
    },
  }
}
