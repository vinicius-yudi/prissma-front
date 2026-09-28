import { zodResolver } from "@hookform/resolvers/zod"
import { AlertTriangle, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"
import { IMAGE_ACCEPT_ATTRIBUTE, MAX_ATTACHMENT_SIZE_MB } from "@/shared/constants/attachments"
import { getFirstFormErrorMessage } from "@/shared/utils/formValidation"

import {
  PREVIA_IA_FORM_DEFAULTS,
  previaIASchema,
  type PreviaIAFormData,
} from "../schemas/propostaSchema"
import {
  COLOR_PALETTE,
  DESIGN_STYLES,
  FLOORING,
  LIGHTING,
  type ColorPalette,
  type PreviewOptions,
  type Proposal,
} from "../types/proposal"
import { AttachmentDropzone } from "./AttachmentDropzone"

/** Máximo que o backend aceita na paleta — acima disso o prompt vira lista de compras. */
const MAX_COLORS = 5

const formLabel = tv({
  base: "block text-xs font-semibold uppercase tracking-widest text-primary",
})

const colorChip = tv({
  base: "rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors",
  variants: {
    selected: {
      true: "border-gold bg-tint text-gold-bright",
      false:
        "border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface",
    },
  },
})

interface GenerateInput {
  rawImage: File
  floorPlan: File | null
  options: PreviewOptions
}

interface PreviaIAModalProps {
  open: boolean
  onClose: () => void
  /** Null enquanto nenhum card foi escolhido — o modal não abre nesse estado. */
  proposal: Proposal | null
  isProcessing: boolean
  errorMessage: string | null
  onGenerate: (input: GenerateInput) => void
  validateImage: (file: File) => boolean
}

/**
 * "✦ Prévia visual IA" (Telas §19).
 *
 * O ambiente **não** é campo: ele já foi escolhido ao criar a proposta, e
 * deixar o usuário trocá-lo aqui produziria uma v2 de cozinha dentro de uma
 * proposta de sala. Os outros seis campos do prompt são livres a cada geração
 * — é assim que v2 e v3 diferem entre si.
 *
 * Durante o processamento o formulário continua montado, apenas desabilitado:
 * desmontá-lo perderia as escolhas, e a falha da IA (que acontece) devolveria
 * o usuário a um formulário em branco.
 */
export function PreviaIAModal({
  open,
  onClose,
  proposal,
  isProcessing,
  errorMessage,
  onGenerate,
  validateImage,
}: PreviaIAModalProps) {
  const { t } = useTranslation()
  const [rawImage, setRawImage] = useState<File | null>(null)
  const [floorPlan, setFloorPlan] = useState<File | null>(null)
  const [rawPreviewUrl, setRawPreviewUrl] = useState<string | null>(null)

  const form = useForm<PreviaIAFormData>({
    resolver: zodResolver(previaIASchema),
    defaultValues: PREVIA_IA_FORM_DEFAULTS,
  })

  const colors = form.watch("colors")

  useEffect(() => {
    if (!open) return
    form.reset(PREVIA_IA_FORM_DEFAULTS)
    setRawImage(null)
    setFloorPlan(null)
  }, [open, form])

  // Miniatura da foto escolhida. A URL de objeto é revogada ao trocar de
  // arquivo e ao fechar — sem isso o blob fica na memória da aba.
  useEffect(() => {
    if (!rawImage) {
      setRawPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(rawImage)
    setRawPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [rawImage])

  function pickRawImage(file: File) {
    if (!validateImage(file)) return
    setRawImage(file)
  }

  function pickFloorPlan(file: File) {
    if (!validateImage(file)) return
    setFloorPlan(file)
  }

  function toggleColor(color: ColorPalette) {
    const current = form.getValues("colors")
    if (current.includes(color)) {
      form.setValue(
        "colors",
        current.filter((c) => c !== color),
        { shouldValidate: true },
      )
      return
    }
    if (current.length >= MAX_COLORS) {
      toast.error(t("obra.propostas.previa.maxColors", { max: MAX_COLORS }))
      return
    }
    form.setValue("colors", [...current, color], { shouldValidate: true })
  }

  function onSubmit(data: PreviaIAFormData) {
    if (!proposal) return
    if (!rawImage) {
      toast.error(t("obra.propostas.previa.rawImageRequired"))
      return
    }

    onGenerate({
      rawImage,
      floorPlan,
      options: {
        // O ambiente vem da proposta, não do formulário.
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

  // Os erros vêm pelo argumento, não de `form.formState.errors`: naquele
  // render o formState ainda é o anterior ao submit e o toast sairia vazio.
  function onInvalid(errors: typeof form.formState.errors) {
    const message = getFirstFormErrorMessage(errors)
    if (message) toast.error(message)
  }

  if (!proposal) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.propostas.previa.title")}
      description={proposal.title}
      icon={<Sparkles size={18} />}
      size="2xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col">
        <fieldset disabled={isProcessing} className="mx-6 mt-5 space-y-5">
          {/* Aviso literal da spec: o usuário precisa saber que a espera é
              longa antes de disparar, não depois. */}
          <p className="flex items-start gap-2 rounded-xl bg-tint px-4 py-3 text-xs leading-relaxed text-on-surface-variant">
            <Sparkles size={14} strokeWidth={1.8} className="mt-px shrink-0 text-gold-bright" />
            {t("obra.propostas.previa.warning")}
          </p>

          <div className="space-y-1.5">
            <Label className={formLabel()}>{t("obra.propostas.previa.fields.rawImage")}</Label>
            {rawPreviewUrl ? (
              <div className="space-y-2">
                <div className="aspect-[3/2] w-full overflow-hidden rounded-xl border border-outline-variant">
                  <img
                    src={rawPreviewUrl}
                    alt={t("obra.propostas.previa.rawImageAlt")}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Num className="min-w-0 truncate text-[11px] text-on-surface-faint">
                    {rawImage?.name}
                  </Num>
                  <button
                    type="button"
                    onClick={() => setRawImage(null)}
                    className="shrink-0 text-[11px] font-semibold text-gold-bright hover:text-gold"
                  >
                    {t("obra.propostas.previa.changeFile")}
                  </button>
                </div>
              </div>
            ) : (
              <AttachmentDropzone
                accept={IMAGE_ACCEPT_ATTRIBUTE}
                acceptLabel="PNG · JPG · WEBP"
                maxSizeMb={MAX_ATTACHMENT_SIZE_MB}
                isUploading={false}
                onFile={pickRawImage}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className={formLabel()}>{t("obra.propostas.previa.fields.floorPlan")}</Label>
            {floorPlan ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                <Num className="min-w-0 truncate text-[11.5px] text-on-surface-variant">
                  {floorPlan.name}
                </Num>
                <button
                  type="button"
                  onClick={() => setFloorPlan(null)}
                  className="shrink-0 text-[11px] font-semibold text-gold-bright hover:text-gold"
                >
                  {t("obra.propostas.previa.removeFile")}
                </button>
              </div>
            ) : (
              <AttachmentDropzone
                accept={IMAGE_ACCEPT_ATTRIBUTE}
                acceptLabel="PNG · JPG · WEBP"
                maxSizeMb={MAX_ATTACHMENT_SIZE_MB}
                isUploading={false}
                onFile={pickFloorPlan}
              />
            )}
            <p className="text-[11px] text-on-surface-faint">
              {t("obra.propostas.previa.floorPlanHint")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="previa-estilo" className={formLabel()}>
                {t("obra.propostas.previa.fields.style")}
              </Label>
              <Select id="previa-estilo" {...form.register("style")}>
                {DESIGN_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {t(`obra.propostas.styles.${style}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="previa-iluminacao" className={formLabel()}>
                {t("obra.propostas.previa.fields.lighting")}
              </Label>
              <Select id="previa-iluminacao" {...form.register("lighting")}>
                {LIGHTING.map((lighting) => (
                  <option key={lighting} value={lighting}>
                    {t(`obra.propostas.lighting.${lighting}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="previa-piso" className={formLabel()}>
                {t("obra.propostas.previa.fields.flooring")}
              </Label>
              <Select id="previa-piso" {...form.register("flooring")}>
                {FLOORING.map((flooring) => (
                  <option key={flooring} value={flooring}>
                    {t(`obra.propostas.flooring.${flooring}`)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="previa-modo" className={formLabel()}>
                {t("obra.propostas.previa.fields.mode")}
              </Label>
              <Select id="previa-modo" {...form.register("generationMode")}>
                <option value="PREVIEW">{t("obra.propostas.modes.PREVIEW")}</option>
                <option value="FINAL">{t("obra.propostas.modes.FINAL")}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={formLabel()}>{t("obra.propostas.previa.fields.colors")}</Label>
            {/* Chips em vez de multiselect nativo: no celular o <select
                multiple> é inoperável, e a paleta é curta o bastante para caber. */}
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-pressed={colors.includes(color)}
                  onClick={() => toggleColor(color)}
                  className={colorChip({ selected: colors.includes(color) })}
                >
                  {t(`obra.propostas.colors.${color}`)}
                </button>
              ))}
            </div>
            <Num className="text-[11px] text-on-surface-faint">
              {t("obra.propostas.previa.colorsCount", { selected: colors.length, max: MAX_COLORS })}
            </Num>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="previa-instrucoes" className={formLabel()}>
              {t("obra.propostas.previa.fields.instructions")}
            </Label>
            <Textarea
              id="previa-instrucoes"
              rows={3}
              placeholder={t("obra.propostas.previa.placeholders.instructions")}
              {...form.register("additionalInstructions")}
            />
          </div>
        </fieldset>

        {isProcessing && (
          <div className="mx-6 mt-5 space-y-2">
            {/* Barra cheia pulsando: a IA não reporta percentual, e inventar um
                número seria mentir sobre o que sabemos. */}
            <Progress
              value={100}
              height={6}
              className="animate-pulse"
              label={t("obra.propostas.generating")}
            />
            <p className="text-center text-xs text-on-surface-variant">
              {t("obra.propostas.previa.processing")}
            </p>
          </div>
        )}

        {!isProcessing && errorMessage && (
          <p className="mx-6 mt-5 flex items-start gap-2 rounded-xl bg-warn-bg px-4 py-3 text-xs leading-relaxed text-warn">
            <AlertTriangle size={14} strokeWidth={1.8} className="mt-px shrink-0" />
            {errorMessage}
          </p>
        )}

        <div className="mx-6 mb-6 mt-5 flex items-center justify-between gap-3 border-t border-outline-variant pt-5">
          <Button type="button" variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.propostas.actions.close")}
          </Button>
          <Button type="submit" className="w-auto px-4" disabled={isProcessing}>
            <span className="inline-flex items-center justify-center gap-1.5">
              <Sparkles size={14} strokeWidth={1.8} />
              {isProcessing
                ? t("obra.propostas.previa.generating")
                : t("obra.propostas.previa.submit")}
            </span>
          </Button>
        </div>
      </form>
    </Modal>
  )
}
