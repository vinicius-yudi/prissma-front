import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import { acceptInvite } from "@/shared/services/workspace.service"

export interface InviteFormValues {
  fullName: string
  password: string
}

interface UseAcceptInviteResult {
  form: UseFormReturn<InviteFormValues>
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
  isPending: boolean
  isSuccess: boolean
  /** Mensagem do backend; vazia quando o erro veio sem texto (queda de rede). */
  error: Error | null
}

/**
 * Aceite de convite. Nome e senha só contam para e-mail novo — o backend os
 * ignora para quem já tem conta —, então vão como `undefined` quando vazios.
 */
export function useAcceptInvite(token: string): UseAcceptInviteResult {
  const form = useForm<InviteFormValues>({ defaultValues: { fullName: "", password: "" } })

  const mutation = useMutation({
    mutationFn: ({ fullName, password }: InviteFormValues) =>
      acceptInvite(token, {
        fullName: fullName.trim() || undefined,
        password: password || undefined,
      }),
  })

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values))

  return {
    form,
    onSubmit,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  }
}
