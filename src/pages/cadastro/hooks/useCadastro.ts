import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

import { useAuth } from "@/contexts/AuthContext"

import { CADASTRO_KINDS } from "../constants/cadastroKinds"
import type { CadastroKind } from "../constants/cadastroKinds"
import { CADASTRO_DEFAULTS, cadastroSchema } from "../schemas/cadastro.schema"
import type { CadastroFormSchema } from "../schemas/cadastro.schema"

interface UseCadastroResult {
  form: UseFormReturn<CadastroFormSchema>
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>
  isPending: boolean
}

/**
 * Cadastro de qualquer perfil. Os três hooks antigos eram cópias com o
 * serviço trocado; o perfil agora escolhe o serviço por tabela. Sucesso já
 * entra logado.
 */
export function useCadastro(kind: CadastroKind): UseCadastroResult {
  const { t } = useTranslation()
  const { saveToken } = useAuth()
  const navigate = useNavigate()

  const form = useForm<CadastroFormSchema>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: CADASTRO_DEFAULTS,
    mode: "onTouched",
  })

  const mutation = useMutation({
    mutationFn: CADASTRO_KINDS[kind].register,
    onSuccess: ({ token }) => {
      saveToken(token)
      navigate("/dashboard")
    },
    onError: (error: Error) => {
      const key = error.message.includes("Email já cadastrado") ? "register.emailTaken" : "register.failed"
      toast.error(t(key))
    },
  })

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data))

  return { form, onSubmit, isPending: mutation.isPending }
}
