import { Check, Loader2, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { formatProjectAddress } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"

import type { UseProjectStepFormResult } from "../hooks/useProjectStepForm"

/** Máscara só de exibição: o formulário guarda os oito dígitos crus. */
function maskCep(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

type ProjectAddressStepProps = Pick<
  UseProjectStepFormResult,
  "form" | "isLookingUp" | "numeroRef" | "handleCepChange"
> & { project?: Project | null }

/** Passo 2 — o endereço. O CEP consulta o viacep e preenche o resto. */
export function ProjectAddressStep({ form, isLookingUp, numeroRef, handleCepChange, project }: ProjectAddressStepProps) {
  const { t } = useTranslation()
  const { errors } = form.formState
  const cep = form.watch("cep")
  const addressFilled = cep.length === 8 && !isLookingUp && form.watch("logradouro") !== ""

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  const { ref: numeroRegisterRef, ...numeroProps } = form.register("numero")
  function numeroMergedRef(el: HTMLInputElement | null) {
    numeroRegisterRef(el)
    numeroRef.current = el
  }

  return (
    <div className="space-y-4 px-6 pt-5 pb-2">
      {project && (
        <div className="flex items-start gap-2 rounded-[10px] bg-raised/60 px-3 py-2.5 hairline">
          <MapPin size={14} className="mt-0.5 flex-none text-ink-2" />
          <div>
            <p className="mb-0.5 text-[12px] text-meta">{t("projectModal.currentAddress")}</p>
            <p className="text-[14px] text-ink">{formatProjectAddress(project)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t("projectModal.cep")} error={errorOf(errors.cep?.message)}>
          {(id) => (
            <Input
              id={id}
              inputMode="numeric"
              className="t-num"
              placeholder={t("projectModal.cepPlaceholder")}
              aria-invalid={!!errors.cep}
              value={maskCep(cep)}
              onChange={(e) => handleCepChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
              suffix={
                isLookingUp ? (
                  <Loader2 size={15} className="animate-spin text-gold-hi" aria-label={t("projectModal.cepLooking")} />
                ) : (
                  addressFilled && <Check size={15} className="text-success" />
                )
              }
            />
          )}
        </Field>

        <Field label={t("projectModal.uf")} error={errorOf(errors.uf?.message)}>
          {(id) => <Input id={id} placeholder="SP" aria-invalid={!!errors.uf} {...form.register("uf")} />}
        </Field>

        <Field label={t("projectModal.logradouro")} error={errorOf(errors.logradouro?.message)} className="md:col-span-2">
          {(id) => (
            <Input
              id={id}
              placeholder={t("projectModal.logradouroPlaceholder")}
              aria-invalid={!!errors.logradouro}
              {...form.register("logradouro")}
            />
          )}
        </Field>

        <Field label={t("projectModal.numero")} error={errorOf(errors.numero?.message)}>
          {(id) => (
            <Input id={id} ref={numeroMergedRef} placeholder="123" aria-invalid={!!errors.numero} {...numeroProps} />
          )}
        </Field>

        <Field label={t("projectModal.complemento")}>
          {(id) => <Input id={id} placeholder={t("projectModal.complementoPlaceholder")} {...form.register("complemento")} />}
        </Field>

        <Field label={t("projectModal.bairro")} error={errorOf(errors.bairro?.message)}>
          {(id) => (
            <Input id={id} placeholder={t("projectModal.bairroPlaceholder")} aria-invalid={!!errors.bairro} {...form.register("bairro")} />
          )}
        </Field>

        <Field label={t("projectModal.cidade")} error={errorOf(errors.cidade?.message)}>
          {(id) => (
            <Input id={id} placeholder={t("projectModal.cidadePlaceholder")} aria-invalid={!!errors.cidade} {...form.register("cidade")} />
          )}
        </Field>
      </div>
    </div>
  )
}
