import { LayoutGrid, Loader2 } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"

import { usePropostaForm } from "../../hooks/usePropostaForm"
import { ENVIRONMENT_TYPES } from "../../types/proposal"

interface PropostaFormModalProps {
  open: boolean
  onClose: () => void
  projectId: number
}

/** Criar proposta: título, ambiente, descrição e imagem opcional. */
export function PropostaFormModal({ open, onClose, projectId }: PropostaFormModalProps) {
  const { t } = useTranslation()
  const { form, pickFile, handleSave, isSaving } = usePropostaForm(projectId, onClose)
  const { errors } = form.formState

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    // Recusado, o campo volta vazio: a tela não mostra um arquivo que não vai subir.
    if (!pickFile(event.target.files?.[0] ?? null)) event.target.value = ""
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.propostas.form.title")}
      description={t("obra.propostas.form.description")}
      icon={<LayoutGrid size={18} />}
      size="lg"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.propostas.actions.cancel")}
          </Button>
          <Button fullWidth={false} onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? t("obra.propostas.actions.saving") : t("obra.propostas.actions.submit")}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="grid gap-4 px-6 pt-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
      >
        <Field label={t("obra.propostas.form.fields.title")} error={errors.title?.message && t(errors.title.message)}>
          {(id) => <Input id={id} placeholder={t("obra.propostas.form.placeholders.title")} aria-invalid={!!errors.title} {...form.register("title")} />}
        </Field>
        <Field label={t("obra.propostas.form.fields.environment")}>
          {(id) => (
            <Select id={id} {...form.register("environmentType")}>
              {ENVIRONMENT_TYPES.map((environment) => (
                <option key={environment} value={environment}>
                  {t(`obra.propostas.environments.${environment}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("obra.propostas.form.fields.description")} error={errors.description?.message && t(errors.description.message)}>
          {(id) => <Textarea id={id} rows={3} placeholder={t("obra.propostas.form.placeholders.description")} {...form.register("description")} />}
        </Field>
        <Field label={t("obra.propostas.form.fields.file")} hint={t("obra.propostas.form.fileHint")}>
          {(id) => (
            <input
              id={id}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFile}
              className="block w-full cursor-pointer rounded-md bg-raised px-3.5 py-2.5 text-[13.5px] text-ink-2 hairline file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-[12.5px] file:font-[620] file:text-ink"
            />
          )}
        </Field>
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
