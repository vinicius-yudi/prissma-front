import { z } from "zod"

import { COLOR_PALETTE, DESIGN_STYLES, ENVIRONMENT_TYPES, FLOORING, GENERATION_MODES, LIGHTING } from "../types/proposal"

/** Mensagens são chaves de i18n: a view faz `t(message)`. */
const E = "obra.propostas.validation"

export const propostaSchema = z.object({
  title: z.string().trim().min(1, `${E}.titleRequired`).max(255, `${E}.tooLong`),
  description: z.string().max(2000, `${E}.tooLong`).optional(),
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
    .min(1, `${E}.colorsMin`)
    .max(5, `${E}.colorsMax`),
  lighting: z.enum(LIGHTING),
  flooring: z.enum(FLOORING),
  generationMode: z.enum(GENERATION_MODES),
  additionalInstructions: z.string().max(1000, `${E}.tooLong`).optional(),
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
