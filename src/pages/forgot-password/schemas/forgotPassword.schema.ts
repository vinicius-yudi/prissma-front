import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "validation.emailRequired").email("validation.emailInvalid"),
})

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>
