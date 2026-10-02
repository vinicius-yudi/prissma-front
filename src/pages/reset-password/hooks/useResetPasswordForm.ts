import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"

import { resetPasswordSchema } from "../schemas/resetPassword.schema"
import type { ResetPasswordSchema } from "../schemas/resetPassword.schema"
import { resetPassword } from "../services/reset-password.service"

interface UseResetPasswordFormResult {
  form: UseFormReturn<ResetPasswordSchema>
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
  isPending: boolean
  /** Sem token no link não há o que redefinir — a página redireciona. */
  hasToken: boolean
}

export function useResetPasswordForm(): UseResetPasswordFormResult {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const navigate = useNavigate()

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onTouched",
  })

  const mutation = useMutation({
    mutationFn: (newPassword: string) => resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success(t("resetPassword.success"))
      navigate("/login")
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = form.handleSubmit(({ newPassword }) => mutation.mutate(newPassword))

  return { form, onSubmit, isPending: mutation.isPending, hasToken: token !== "" }
}
