import { Check } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Field } from "@/shared/components/ui/field/Field"
import { Label } from "@/shared/components/ui/label/Label"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"

import { MAX_COLORS, type UsePreviaFormResult } from "../../hooks/usePreviaForm"
import { COLOR_PALETTE, DESIGN_STYLES, FLOORING, GENERATION_MODES, LIGHTING } from "../../types/proposal"

const chip = tv({
  base: "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-pill px-3.5 text-[12.5px] font-[600] transition-colors",
  variants: { selected: { true: "bg-gold text-on-gold", false: "bg-surface text-ink-2 hairline hover:text-ink" } },
})

/** Os seis campos do prompt: estilo, luz, piso, modo, paleta e instruções. */
export function PreviaOptionsFields({ state }: { state: UsePreviaFormResult }) {
  const { t } = useTranslation()
  const { form, colors } = state
  const { errors } = form.formState

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("obra.propostas.previa.fields.style")}>
          {(id) => (
            <Select id={id} {...form.register("style")}>
              {DESIGN_STYLES.map((style) => (
                <option key={style} value={style}>{t(`obra.propostas.styles.${style}`)}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.propostas.previa.fields.lighting")}>
          {(id) => (
            <Select id={id} {...form.register("lighting")}>
              {LIGHTING.map((lighting) => (
                <option key={lighting} value={lighting}>{t(`obra.propostas.lighting.${lighting}`)}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.propostas.previa.fields.flooring")}>
          {(id) => (
            <Select id={id} {...form.register("flooring")}>
              {FLOORING.map((flooring) => (
                <option key={flooring} value={flooring}>{t(`obra.propostas.flooring.${flooring}`)}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.propostas.previa.fields.mode")}>
          {(id) => (
            <Select id={id} {...form.register("generationMode")}>
              {GENERATION_MODES.map((mode) => (
                <option key={mode} value={mode}>{t(`obra.propostas.modes.${mode}`)}</option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-2">
        <Label>{t("obra.propostas.previa.fields.colors")}</Label>
        {/* Chips em vez de multiselect: no celular o <select multiple> é inoperável. */}
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map((color) => {
            const selected = colors.includes(color)
            return (
              <button key={color} type="button" aria-pressed={selected} onClick={() => state.toggleColor(color)} className={chip({ selected })}>
                {selected && <Check size={13} strokeWidth={3} />}
                {t(`obra.propostas.colors.${color}`)}
              </button>
            )
          })}
        </div>
        {errors.colors?.message ? (
          <p role="alert" className="text-[12.5px] font-[560] text-danger">{t(errors.colors.message)}</p>
        ) : (
          <span className="t-num text-[12px] text-meta">{t("obra.propostas.previa.colorsCount", { selected: colors.length, max: MAX_COLORS })}</span>
        )}
      </div>

      <Field label={t("obra.propostas.previa.fields.instructions")} error={errors.additionalInstructions?.message && t(errors.additionalInstructions.message)}>
        {(id) => <Textarea id={id} rows={3} placeholder={t("obra.propostas.previa.placeholders.instructions")} {...form.register("additionalInstructions")} />}
      </Field>
    </>
  )
}
