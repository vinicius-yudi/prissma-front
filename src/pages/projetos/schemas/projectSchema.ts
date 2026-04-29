import { z } from "zod"

const step1Fields = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres"),
  projectType: z.string().min(1, "Selecione o tipo de projeto"),
  category: z.string().min(1, "Selecione a categoria"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"]),
  landArea: z.number().positive("Área deve ser maior que zero"),
  builtArea: z.number().positive("Área deve ser maior que zero"),
  plannedStartDate: z.string().min(1, "Data de início é obrigatória"),
  plannedEndDate: z.string().min(1, "Data de término é obrigatória"),
})

const step2Fields = z.object({
  cep: z.string().length(8, "CEP deve ter 8 dígitos"),
  logradouro: z.string().min(1, "Logradouro obrigatório"),
  numero: z.string().min(1, "Número obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro obrigatório"),
  cidade: z.string().min(1, "Cidade obrigatória"),
  uf: z.string().length(2, "UF inválida"),
})

export const projectSchema = step1Fields.merge(step2Fields).refine(
  (d) => new Date(d.plannedEndDate) > new Date(d.plannedStartDate),
  { message: "A data de término deve ser posterior à data de início", path: ["plannedEndDate"] },
)

export type ProjectFormData = z.infer<typeof projectSchema>

export const STEP1_FIELDS: (keyof ProjectFormData)[] = [
  "title",
  "projectType",
  "category",
  "status",
  "landArea",
  "builtArea",
  "plannedStartDate",
  "plannedEndDate",
]

export const STEP2_FIELDS: (keyof ProjectFormData)[] = [
  "cep",
  "logradouro",
  "numero",
  "bairro",
  "cidade",
  "uf",
]

export const PROJECT_FORM_DEFAULTS: ProjectFormData = {
  title: "",
  projectType: "",
  category: "",
  status: "PLANNING",
  landArea: 0,
  builtArea: 0,
  plannedStartDate: "",
  plannedEndDate: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
}

export function formatAddress(data: Pick<ProjectFormData, "logradouro" | "numero" | "complemento" | "bairro" | "cidade" | "uf" | "cep">): string {
  const { logradouro, numero, complemento, bairro, cidade, uf, cep } = data
  const cepFormatted = `${cep.slice(0, 5)}-${cep.slice(5)}`
  const compPart = complemento && complemento.trim() ? `, ${complemento.trim()}` : ""
  return `${logradouro}, ${numero}${compPart} - ${bairro}, ${cidade} - ${uf}, ${cepFormatted}`
}
