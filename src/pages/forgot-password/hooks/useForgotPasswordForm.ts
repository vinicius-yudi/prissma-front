import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { toast } from "react-toastify"

import { forgotPasswordSchema } from "../schemas/forgotPassword.schema"
import type { ForgotPasswordSchema } from "../schemas/forgotPassword.schema"
import { forgotPassword } from "../services/forgot-password.service"

interface UseForgotPasswordFormResult {
  form: UseFormReturn<ForgotPasswordSchema>
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
  isPending: boolean
  /** E-mail para o qual o link foi pedido; `null` enquanto não foi enviado. */
  sentTo: string | null
}

export function useForgotPasswordForm(): UseForgotPasswordFormResult {
  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  })

  const mutation = useMutation({
    mutationFn: forgotPassword,
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = form.handleSubmit(({ email }) => mutation.mutate(email))

  return {
    form,
    onSubmit,
    isPending: mutation.isPending,
    sentTo: mutation.isSuccess ? (mutation.variables ?? null) : null,
  }
}
