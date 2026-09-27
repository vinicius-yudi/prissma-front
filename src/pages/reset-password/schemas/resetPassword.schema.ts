import { z } from "zod"

import { PASSWORD_RULES } from "@/shared/components/auth/passwordRuleList"

/** Mesmas regras do cadastro, vindas da mesma lista que a tela marca. */
export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), "validation.passwordRules"),
    confirmPassword: z.string().min(1, "validation.confirmRequired"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "validation.passwordMismatch",
    path: ["confirmPassword"],
  })

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
