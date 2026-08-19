import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty("O e-mail é obrigatório.")
    .email("Informe um e-mail válido."),
  password: z
    .string()
    .nonempty("A senha é obrigatória.")
    .min(6, "A senha deve ter no mínimo 6 caracteres."),
});

export type LoginFormSchema = z.infer<typeof loginSchema>;