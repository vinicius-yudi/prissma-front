import { FileText, UploadCloud } from "lucide-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import {
  DOCUMENT_ACCEPT_ATTRIBUTE,
  MAX_ATTACHMENT_SIZE_MB,
} from "@/shared/constants/attachments"
import { Num } from "@/shared/components/ui/num/Num"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { useAccess } from "@/shared/hooks/useAccess"

import { useDocumentos } from "../hooks/useDocumentos"
import { AttachmentDropzone } from "./AttachmentDropzone"
import { DocumentRow } from "./DocumentRow"

interface DocumentosTabProps {
  projectId: number
}

/**
 * Documentos & anexos (Telas §18).
 *
 * A dropzone é a ação principal e fica no topo — não um botão discreto no
 * canto. Validação, upload e download vivem em `useDocumentos`.
 */
export function DocumentosTab({ projectId }: DocumentosTabProps) {
  const { t } = useTranslation()
  const { isReadOnly } = useAccess()
  const docs = useDocumentos(projectId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // O FAB do celular abre o mesmo seletor da dropzone. `.click()` a partir do
  // toque conta como gesto do usuário, então o navegador permite.
  usePrimaryAction(
    isReadOnly("documentos")
      ? null
      : {
          label: t("obra.documentos.add"),
          icon: UploadCloud,
          disabled: docs.isUploading,
          onClick: () => fileInputRef.current?.click(),
        },
  )

  if (docs.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-surface-container-low" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-container-low" />
        <div className="h-12 animate-pulse rounded-xl bg-surface-container-low" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <AttachmentDropzone
        accept={DOCUMENT_ACCEPT_ATTRIBUTE}
        acceptLabel="PDF · DOCX"
        maxSizeMb={MAX_ATTACHMENT_SIZE_MB}
        isUploading={docs.isUploading}
        onFile={docs.submitFile}
        inputRef={fileInputRef}
      />

      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-on-surface">{t("obra.documentos.title")}</h2>
          <Num className="text-[11.5px] text-on-surface-faint">
            {t("obra.documentos.count", { count: docs.documents.length })}
          </Num>
        </div>

        {docs.documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <FileText size={24} strokeWidth={1.6} className="text-on-surface-faint" />
            <p className="text-sm text-on-surface-variant">{t("obra.documentos.empty")}</p>
          </div>
        ) : (
          <div>
            {docs.documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                attachment={doc}
                isDownloading={docs.downloadingId === doc.id}
                onDownload={docs.download}
                onRemove={docs.remove}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
