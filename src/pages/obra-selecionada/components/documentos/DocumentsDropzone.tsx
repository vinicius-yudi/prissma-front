import { UploadCloud } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import type { ChangeEvent, DragEvent, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Select } from "@/shared/components/ui/select/Select"

import type { Stage } from "../../services/stages.service"

const zone = tv({
  base: "blueprint relative flex flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed px-6 py-10 text-center transition-colors",
  variants: { over: { true: "border-gold bg-gold-soft/40", false: "border-border-strong bg-surface" } },
})

const bubble = tv({
  base: "flex size-14 items-center justify-center rounded-full",
  variants: { over: { true: "bg-gold text-on-gold", false: "bg-raised text-gold-hi hairline" } },
})

interface DocumentsDropzoneProps {
  accept: string
  maxSizeMb: number
  maxBatch: number
  stages: Stage[]
  stageId: number | null
  onStageChange: (stageId: number | null) => void
  onFiles: (files: File[]) => void
  /** O FAB do celular abre o mesmo seletor. */
  inputRef: RefObject<HTMLInputElement | null>
}

/**
 * Zona de envio sobre blueprint: arrastar ou escolher, com a etapa a que os
 * arquivos ficam vinculados. O ícone sobe quando o arquivo está por cima.
 */
export function DocumentsDropzone({ accept, maxSizeMb, maxBatch, stages, stageId, onStageChange, onFiles, inputRef }: DocumentsDropzoneProps) {
  const { t } = useTranslation()
  const [over, setOver] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setOver(false)
    if (event.dataTransfer.files.length) onFiles(Array.from(event.dataTransfer.files))
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) onFiles(Array.from(event.target.files))
    event.target.value = ""
  }

  return (
    <motion.div
      data-testid="documents-dropzone"
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={handleDrop}
      animate={{ scale: over ? 1.01 : 1 }}
      className={zone({ over })}
    >
      <motion.span animate={{ y: over ? -6 : 0 }} transition={{ type: "spring", stiffness: 300, damping: 16 }} className={bubble({ over })}>
        <UploadCloud size={24} />
      </motion.span>
      <div>
        <p className="t-section text-[17px] text-ink">{over ? t("obra.documentos.dropzone.release") : t("obra.documentos.dropzone.headline")}</p>
        <p className="mt-1 text-[13.5px] text-ink-2">{t("obra.documentos.dropzone.accepts", { max: maxSizeMb, batch: maxBatch })}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-10 cursor-pointer rounded-[10px] bg-gold-grad px-4 text-[14px] font-[620] text-on-gold hover:brightness-108"
        >
          {t("obra.documentos.dropzone.choose")}
        </button>
        <Select
          aria-label={t("obra.documentos.dropzone.stage")}
          value={stageId ?? ""}
          onChange={(event) => onStageChange(event.target.value ? Number(event.target.value) : null)}
          className="h-10"
          wrapperClassName="w-auto"
        >
          <option value="">{t("obra.documentos.dropzone.noStage")}</option>
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </Select>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple hidden onChange={handleChange} data-testid="documents-input" />
    </motion.div>
  )
}
