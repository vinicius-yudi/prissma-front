import { z } from "zod"

import { PASSWORD_RULES } from "@/shared/components/auth/passwordRuleList"

/**
 * Cadastro dos três perfis — as regras são as mesmas, e as da senha vêm do
 * backend. Mensagens são chaves i18n; a view traduz com `t(error.message)`.
 */
export const cadastroSchema = z
  .object({
    name: z.string().trim().min(3, "validation.nameMin"),
    email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
    // Mesma lista que a tela marca enquanto o usuário digita.
    password: z
      .string()
      .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), "validation.passwordRules"),
    confirmPassword: z.string().min(1, "validation.confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  })

export type CadastroFormSchema = z.infer<typeof cadastroSchema>

export const CADASTRO_DEFAULTS: CadastroFormSchema = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}
