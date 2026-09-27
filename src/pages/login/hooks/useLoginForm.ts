import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

import { useAuth } from "@/contexts/AuthContext"

import { LOGIN_DEFAULTS, loginSchema } from "../schemas/login.schema"
import type { LoginFormSchema } from "../schemas/login.schema"
import { login } from "../services/login.service"

interface UseLoginFormResult {
  form: UseFormReturn<LoginFormSchema>
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
  isPending: boolean
}

/**
 * Login: erro de campo vai no campo (react-hook-form + zod); toast só para o
 * erro do servidor. A sessão anterior é derrubada antes de pedir a nova, para
 * nenhum dado de outra conta sobreviver no cache.
 */
export function useLoginForm(): UseLoginFormResult {
  const { t } = useTranslation()
  const { saveToken, logout } = useAuth()
  const navigate = useNavigate()

  const form = useForm<LoginFormSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: LOGIN_DEFAULTS,
    mode: "onTouched",
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: ({ token }) => {
      saveToken(token)
      navigate("/dashboard")
    },
    onError: (error: Error) => {
      const key = error.message.includes("Invalid credentials") ? "login.invalidCredentials" : "login.failed"
      toast.error(t(key))
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    logout()
    mutation.mutate(data)
  })

  return { form, onSubmit, isPending: mutation.isPending }
}
