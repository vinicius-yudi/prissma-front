import { z } from "zod";

export const cadastroArquitetoSchema = z
  .object({
    name: z
      .string()
      .min(3, "O nome deve conter pelo menos 3 caracteres")
      .nonempty("Nome é obrigatório"),
    email: z
      .string()
      .email("Formato de e-mail inválido")
      .nonempty("E-mail é obrigatório"),
    password: z
      .string()
      .min(6, "A senha deve ter pelo menos 6 caracteres")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "A senha deve conter pelo menos um número")
      .regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um símbolo especial")
      .nonempty("Senha é obrigatória"),
    confirmPassword: z
      .string()
      .nonempty("A confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type CadastroFormSchema = z.infer<typeof cadastroArquitetoSchema>;