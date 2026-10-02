import { FileText } from "lucide-react"
import { AnimatePresence } from "motion/react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import type { Attachment } from "@/shared/types/attachment"

import { DocumentItem } from "./DocumentItem"

interface DocumentListProps {
  documents: Attachment[]
  filtered: boolean
  stageById: Map<number, string>
  memberById: Map<number, string>
  downloadingId: number | null
  canDelete: boolean
  onClearFilter: () => void
  onDownload: (attachment: Attachment) => void
  onDelete: (attachment: Attachment) => void
}

/** Lista dos arquivos, ou o vazio que diz o que anexar. */
export function DocumentList(props: DocumentListProps) {
  const { t } = useTranslation()

  if (props.documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={26} />}
        title={props.filtered ? t("obra.documentos.emptyFiltered") : t("obra.documentos.emptyTitle")}
        body={props.filtered ? undefined : t("obra.documentos.emptyBody")}
        action={
          props.filtered && (
            <Button variant="outline" fullWidth={false} onClick={props.onClearFilter}>
              {t("obra.documentos.showAll")}
            </Button>
          )
        }
      />
    )
  }

  return (
    <section aria-label={t("obra.documentos.title")} className="overflow-hidden rounded-lg bg-surface hairline">
      <ul className="divide-y divide-border p-0">
        <AnimatePresence initial={false}>
          {props.documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              attachment={doc}
              stageName={doc.stageId ? (props.stageById.get(doc.stageId) ?? null) : null}
              uploaderName={props.memberById.get(doc.uploadedByUserId) ?? null}
              isDownloading={props.downloadingId === doc.id}
              canDelete={props.canDelete}
              onDownload={props.onDownload}
              onDelete={props.onDelete}
            />
          ))}
        </AnimatePresence>
      </ul>
    </section>
  )
}
