import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { PREVIA_IA_FORM_DEFAULTS, previaIASchema, type PreviaIAFormData } from "../schemas/propostaSchema"
import type { ColorPalette, PreviewOptions, Proposal } from "../types/proposal"

/** Máximo que o backend aceita na paleta — acima disso o prompt vira lista de compras. */
export const MAX_COLORS = 5

export interface GenerateInput {
  rawImage: File
  floorPlan: File | null
  options: PreviewOptions
}

interface UsePreviaFormArgs {
  proposal: Proposal
  validateImage: (file: File) => boolean
  onGenerate: (input: GenerateInput) => void
}

export interface UsePreviaFormResult {
  form: UseFormReturn<PreviaIAFormData>
  colors: ColorPalette[]
  rawImage: File | null
  floorPlan: File | null
  /** Aviso no campo quando se tenta gerar sem a foto. */
  rawImageMissing: boolean
  pickRawImage: (file: File | null) => void
  pickFloorPlan: (file: File | null) => void
  toggleColor: (color: ColorPalette) => void
  handleGenerate: () => void
}

/**
 * Formulário da prévia por IA. O ambiente não é campo: vem da proposta —
 * trocá-lo aqui geraria uma v2 de cozinha numa proposta de sala. Valores
 * iniciais no mount (quem abre troca a `key`); durante o processamento o
 * formulário só é desabilitado, para a falha da IA não apagar as escolhas.
 */
export function usePreviaForm({ proposal, validateImage, onGenerate }: UsePreviaFormArgs): UsePreviaFormResult {
  const { t } = useTranslation()
  const form = useForm<PreviaIAFormData>({ resolver: zodResolver(previaIASchema), defaultValues: PREVIA_IA_FORM_DEFAULTS })
  const colors = useWatch({ control: form.control, name: "colors" })
  const [rawImage, setRawImage] = useState<File | null>(null)
  const [floorPlan, setFloorPlan] = useState<File | null>(null)
  const [rawImageMissing, setRawImageMissing] = useState(false)

  function pick(setter: (file: File | null) => void) {
    return (file: File | null) => setter(file && validateImage(file) ? file : null)
  }

  function toggleColor(color: ColorPalette) {
    const current = form.getValues("colors")
    if (current.includes(color)) {
      form.setValue("colors", current.filter((c) => c !== color), { shouldValidate: true })
      return
    }
    if (current.length >= MAX_COLORS) {
      toast.error(t("obra.propostas.previa.maxColors", { max: MAX_COLORS }))
      return
    }
    form.setValue("colors", [...current, color], { shouldValidate: true })
  }

  function generate(data: PreviaIAFormData) {
    if (!rawImage) {
      setRawImageMissing(true)
      return
    }
    onGenerate({
      rawImage,
      floorPlan,
      options: {
        environment: proposal.environmentType,
        style: data.style,
        colors: data.colors,
        lighting: data.lighting,
        flooring: data.flooring,
        generationMode: data.generationMode,
        additionalInstructions: data.additionalInstructions || undefined,
      },
    })
  }

  return {
    form,
    colors,
    rawImage,
    floorPlan,
    rawImageMissing: rawImageMissing && !rawImage,
    pickRawImage: pick(setRawImage),
    pickFloorPlan: pick(setFloorPlan),
    toggleColor,
    handleGenerate: () => {
      if (!rawImage) setRawImageMissing(true)
      void form.handleSubmit(generate)()
    },
  }
}
