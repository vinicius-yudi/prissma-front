import { z } from "zod";

export const cadastroObraSchema = z.object({
  title: z.string().min(3, "O título é obrigatório"),
  address: z.string().min(5, "Endereço muito curto"),
  projectType: z.string().min(1, "Selecione o tipo de projeto"),
  category: z.string().min(1, "Selecione a categoria"),
  landArea: z.coerce.number().positive("Área deve ser maior que zero"),
  builtArea: z.coerce.number().positive("Área deve ser maior que zero"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"]),
  plannedStartDate: z.string().min(1, "Data de início é obrigatória"),
  plannedEndDate: z.string().min(1, "Data de término é obrigatória"),
 }).refine((data) => new Date(data.plannedEndDate) > new Date(data.plannedStartDate), {
   message: "A data de término deve ser posterior à data de início",
   path: ["plannedEndDate"],
});

export type CadastroFormDataObra = z.infer<typeof cadastroObraSchema>;