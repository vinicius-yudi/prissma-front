import { ImagePlus, Loader2, Send, X } from "lucide-react"
import { useRef } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import { useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Avatar } from "@/shared/components/ui/avatar/Avatar"
import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Textarea } from "@/shared/components/ui/textarea/Textarea"

import { DIARY_TYPE } from "../../constants/diario"
import type { UseDiarioComposerResult } from "../../hooks/useDiarioComposer"
import { DiaryTypePicker } from "./DiaryTypePicker"

interface DiaryComposerProps {
  composer: UseDiarioComposerResult
  authorName: string | null
  isSaving: boolean
  isUploading: boolean
}

/**
 * "Registro de hoje" (redesign): tipo, texto, data e foto, com Ctrl+Enter
 * registrando. Impedimento troca o botão para perigo — ele vira alerta da obra.
 */
export function DiaryComposer({ composer, authorName, isSaving, isUploading }: DiaryComposerProps) {
  const { t, i18n } = useTranslation()
  const { form, attachment } = composer
  const { errors } = form.formState
  const entryType = useWatch({ control: form.control, name: "entryType" })
  const fileRef = useRef<HTMLInputElement>(null)
  const impediment = entryType === DIARY_TYPE.IMPEDIMENT

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) composer.handleSave()
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) composer.handleAttach(file)
    event.target.value = ""
  }

  return (
    <section aria-label={t("obra.diario.composer.title")} className="rounded-lg bg-surface p-5 hairline sm:p-6 xl:sticky xl:top-[88px]">
      <div className="flex items-center gap-3">
        <Avatar name={authorName} size={36} />
        <div>
          <p className="t-section text-[16px] text-ink">{t("obra.diario.composer.title")}</p>
          <p className="text-[12.5px] text-meta first-letter:uppercase">
            {new Date().toLocaleDateString(i18n.language, { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      <form
        noValidate
        className="mt-5 grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          composer.handleSave()
        }}
      >
        <DiaryTypePicker value={entryType} disabled={isSaving} onChange={(type) => form.setValue("entryType", type)} />

        <Field label={t("obra.diario.form.text")} error={errors.description?.message && t(errors.description.message)}>
          {(id) => (
            <Textarea
              id={id}
              rows={4}
              placeholder={t(`obra.diario.placeholder.${entryType}`)}
              aria-invalid={!!errors.description}
              className="min-h-28 resize-y"
              {...form.register("description")}
              onKeyDown={handleKeyDown}
            />
          )}
        </Field>

        <Field label={t("obra.diario.form.date")} error={errors.entryDate?.message && t(errors.entryDate.message)}>
          {(id) => <Input id={id} type="datetime-local" aria-invalid={!!errors.entryDate} {...form.register("entryDate")} />}
        </Field>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-hidden="true" tabIndex={-1} />
        {attachment ? (
          <div className="flex items-center gap-2 rounded-[11px] bg-raised px-3 py-2 text-[13px] text-ink-2">
            <ImagePlus size={15} className="flex-none text-gold-hi" />
            <span className="min-w-0 flex-1 truncate">{attachment.fileName}</span>
            <button type="button" onClick={composer.clearAttachment} aria-label={t("obra.diario.form.removeAttachment")} className="cursor-pointer rounded-[6px] p-1 text-ink-3 hover:text-ink">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[11px] border border-dashed border-border-strong text-[13px] text-ink-2 transition-colors hover:border-gold hover:text-gold-hi disabled:opacity-60"
          >
            {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
            {isUploading ? t("obra.diario.form.uploading") : t("obra.diario.form.attach")}
          </button>
        )}

        <Button type="submit" variant={impediment ? "destructive" : "primary"} disabled={isSaving || isUploading}>
          {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          {isSaving ? t("obra.diario.form.saving") : t("obra.diario.form.save")}
        </Button>
        <p className="-mt-2 text-center text-[11.5px] text-meta">{t("obra.diario.form.shortcut")}</p>
      </form>
    </section>
  )
}
