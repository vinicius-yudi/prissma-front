import { z } from "zod"

const step1Fields = z.object({
  title: z.string().min(3, "validation.project.titleMin"),
  projectType: z.string().min(1, "validation.project.typeRequired"),
  category: z.string().min(1, "validation.project.categoryRequired"),
  status: z.enum(["PLANNING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"]),
  landArea: z.number().positive("validation.project.areaPositive"),
  builtArea: z.number().positive("validation.project.areaPositive"),
  plannedStartDate: z.string().min(1, "validation.project.startRequired"),
  plannedEndDate: z.string().min(1, "validation.project.endRequired"),
})

const step2Fields = z.object({
  cep: z.string().length(8, "validation.project.cepLength"),
  logradouro: z.string().min(1, "validation.project.streetRequired"),
  numero: z.string().min(1, "validation.project.numberRequired"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "validation.project.districtRequired"),
  cidade: z.string().min(1, "validation.project.cityRequired"),
  uf: z.string().length(2, "validation.project.stateInvalid"),
})

export const projectSchema = step1Fields.merge(step2Fields).refine(
  (d) => new Date(d.plannedEndDate) > new Date(d.plannedStartDate),
  { message: "validation.project.endAfterStart", path: ["plannedEndDate"] },
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
