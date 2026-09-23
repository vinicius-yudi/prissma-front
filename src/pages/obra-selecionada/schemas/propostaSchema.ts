import { z } from "zod"

import {
  COLOR_PALETTE,
  DESIGN_STYLES,
  ENVIRONMENT_TYPES,
  FLOORING,
  LIGHTING,
} from "../types/proposal"

export const propostaSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(255, "Máximo 255 caracteres"),
  description: z.string().max(2000, "Máximo 2000 caracteres").optional(),
  environmentType: z.enum(ENVIRONMENT_TYPES),
})

export type PropostaFormData = z.infer<typeof propostaSchema>

export const PROPOSTA_FORM_DEFAULTS: PropostaFormData = {
  title: "",
  description: "",
  environmentType: "LIVING_ROOM",
}

/**
 * Paleta: o backend aceita de 1 a 5 cores. Menos que uma e a IA escolhe
 * sozinha; mais que cinco e o prompt vira uma lista de compras.
 */
export const previaIASchema = z.object({
  style: z.enum(DESIGN_STYLES),
  colors: z
    .array(z.enum(COLOR_PALETTE))
    .min(1, "Escolha ao menos uma cor")
    .max(5, "No máximo 5 cores"),
  lighting: z.enum(LIGHTING),
  flooring: z.enum(FLOORING),
  generationMode: z.enum(["PREVIEW", "FINAL"]),
  additionalInstructions: z.string().max(1000, "Máximo 1000 caracteres").optional(),
})

export type PreviaIAFormData = z.infer<typeof previaIASchema>

export const PREVIA_IA_FORM_DEFAULTS: PreviaIAFormData = {
  style: "MODERN",
  colors: ["OFF_WHITE"],
  lighting: "WARM_INDIRECT",
  flooring: "LIGHT_PORCELAIN",
  generationMode: "PREVIEW",
  additionalInstructions: "",
}
