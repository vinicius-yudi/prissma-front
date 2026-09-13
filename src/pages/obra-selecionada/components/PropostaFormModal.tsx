import { zodResolver } from "@hookform/resolvers/zod"
import { LayoutGrid } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"
import { getFirstFormErrorMessage } from "@/shared/utils/formValidation"

import { usePropostas } from "../hooks/usePropostas"
import {
  PROPOSTA_FORM_DEFAULTS,
  propostaSchema,
  type PropostaFormData,
} from "../schemas/propostaSchema"
import { ENVIRONMENT_TYPES } from "../types/proposal"

const formLabel = tv({
  base: "block text-xs font-semibold uppercase tracking-widest text-primary",
})

interface PropostaFormModalProps {
  open: boolean
  onClose: () => void
  projectId: number
}

/**
 * "+ Nova proposta" (Telas §19).
 *
 * O arquivo é opcional: a proposta pode nascer só com nome e ambiente e receber
 * a imagem depois, pela prévia da IA. O campo "versão" que a spec lista não
 * existe aqui — quem numera é o servidor, e deixar o usuário escolher só
 * abriria espaço para v3 vir antes de v2.
 */
export function PropostaFormModal({ open, onClose, projectId }: PropostaFormModalProps) {
  const { t } = useTranslation()
  const { createAsync, isCreating, validateImage } = usePropostas(projectId)

  const form = useForm<PropostaFormData>({
    resolver: zodResolver(propostaSchema),
    defaultValues: PROPOSTA_FORM_DEFAULTS,
  })

  useEffect(() => {
    if (open) form.reset(PROPOSTA_FORM_DEFAULTS)
  }, [open, form])

  async function onSubmit(data: PropostaFormData) {
    const input = document.getElementById("proposta-arquivo") as HTMLInputElement | null
    const file = input?.files?.[0] ?? null
    if (file && !validateImage(file)) return

    try {
      await createAsync({
        payload: {
          title: data.title,
          description: data.description || null,
          environmentType: data.environmentType,
        },
        file,
      })
      onClose()
    } catch {
      // O toast já saiu no hook.
    }
  }

  // Os erros vêm pelo argumento, não de `form.formState.errors`: naquele
  // render o formState ainda é o anterior ao submit e o toast sairia vazio.
  function onInvalid(errors: typeof form.formState.errors) {
    const message = getFirstFormErrorMessage(errors)
    if (message) toast.error(message)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.propostas.form.title")}
      description={t("obra.propostas.form.description")}
      icon={<LayoutGrid size={18} />}
      size="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col">
        <div className="mx-6 mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="proposta-titulo" className={formLabel()}>
              {t("obra.propostas.form.fields.title")}
            </Label>
            <Input
              id="proposta-titulo"
              placeholder={t("obra.propostas.form.placeholders.title")}
              {...form.register("title")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proposta-ambiente" className={formLabel()}>
              {t("obra.propostas.form.fields.environment")}
            </Label>
            <Select id="proposta-ambiente" {...form.register("environmentType")}>
              {ENVIRONMENT_TYPES.map((environment) => (
                <option key={environment} value={environment}>
                  {t(`obra.propostas.environments.${environment}`)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proposta-descricao" className={formLabel()}>
              {t("obra.propostas.form.fields.description")}
            </Label>
            <Textarea
              id="proposta-descricao"
              rows={3}
              placeholder={t("obra.propostas.form.placeholders.description")}
              {...form.register("description")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proposta-arquivo" className={formLabel()}>
              {t("obra.propostas.form.fields.file")}
            </Label>
            <input
              id="proposta-arquivo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="block w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-2.5 text-sm text-on-surface-variant file:mr-3 file:rounded-md file:border-0 file:bg-surface-container-highest file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-on-surface"
            />
            <p className="text-[11px] text-on-surface-faint">
              {t("obra.propostas.form.fileHint")}
            </p>
          </div>
        </div>

        <div className="mx-6 mb-6 mt-5 flex items-center justify-between gap-3 border-t border-outline-variant pt-5">
          <Button type="button" variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.propostas.actions.cancel")}
          </Button>
          <Button type="submit" className="w-auto px-4" disabled={isCreating}>
            {isCreating ? t("obra.propostas.actions.saving") : t("obra.propostas.actions.submit")}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
