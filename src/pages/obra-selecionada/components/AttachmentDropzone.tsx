import { UploadCloud } from "lucide-react"
import { useRef, useState, type ChangeEvent, type DragEvent, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Num } from "@/shared/components/ui/num/Num"

/**
 * Dropzone de anexos (Telas §18).
 *
 * Aceita arrastar e clicar. A borda vira ouro com glow no hover e no drag-over,
 * que é o único uso de destaque nesta tela.
 *
 * Sobre o progresso: o design mostra "enviando 62%", mas o upload usa `fetch`,
 * que não reporta progresso de envio. Em vez de animar um número inventado, a
 * barra fica indeterminada — comunica "trabalhando" sem afirmar um percentual
 * que não temos.
 */

const zone = tv({
  base: "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-6 py-9 text-center transition-all",
  variants: {
    over: {
      true: "border-gold bg-surface-container-high shadow-glow",
      false: "border-outline bg-surface-container-low hover:border-gold hover:shadow-glow",
    },
    disabled: {
      true: "pointer-events-none opacity-60",
      false: "",
    },
  },
})

interface AttachmentDropzoneProps {
  /** Valor do atributo `accept` do input. */
  accept: string
  /** Extensões legíveis mostradas ao usuário, ex.: "PDF, DOCX, JPG". */
  acceptLabel: string
  maxSizeMb: number
  isUploading: boolean
  onFile: (file: File) => void
  /**
   * Deixa a tela abrir o seletor de arquivos de fora — é como o FAB do celular
   * dispara o upload sem duplicar o input.
   */
  inputRef?: RefObject<HTMLInputElement | null>
}

export function AttachmentDropzone({
  accept,
  acceptLabel,
  maxSizeMb,
  isUploading,
  onFile,
  inputRef: externalRef,
}: AttachmentDropzoneProps) {
  const { t } = useTranslation()
  const localRef = useRef<HTMLInputElement>(null)
  const inputRef = externalRef ?? localRef
  const [isOver, setIsOver] = useState(false)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ""
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={t("obra.documentos.dropzone.title")}
        className={zone({ over: isOver, disabled: isUploading })}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsOver(true)
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={handleDrop}
      >
        <UploadCloud size={26} strokeWidth={1.7} className="text-gold-bright" />

        <p className="text-[13.5px] font-semibold text-on-surface">
          {t("obra.documentos.dropzone.title")}
        </p>

        <Num className="text-[11px] text-on-surface-faint">
          {acceptLabel} · {t("obra.documentos.dropzone.maxSize", { max: maxSizeMb })}
        </Num>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {isUploading && (
        <div className="mt-3 space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className="h-full w-full animate-pulse rounded-full"
              style={{ backgroundImage: "var(--pk-trena), var(--pk-grad)" }}
            />
          </div>
          <p className="text-[11px] font-semibold text-gold-bright">
            {t("obra.documentos.uploading")}
          </p>
        </div>
      )}
    </div>
  )
}
