import { z } from "zod"

/** Mensagens são chaves i18n: a view traduz com `t(error.message)`. */
export const loginSchema = z.object({
  email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
  // O mínimo de 6 é a regra que o back-end também aplica.
  password: z.string().min(1, "validation.passwordRequired").min(6, "validation.passwordMin"),
})

export type LoginFormSchema = z.infer<typeof loginSchema>

export const LOGIN_DEFAULTS: LoginFormSchema = { email: "", password: "" }
