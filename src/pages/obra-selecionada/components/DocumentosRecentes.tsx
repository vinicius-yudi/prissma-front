import { FileImage, FileText, type LucideIcon } from "lucide-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { isImageMime } from "@/shared/constants/attachments"
import { Num } from "@/shared/components/ui/num/Num"
import { formatDate } from "@/shared/utils/formatters"

import { useAttachments } from "../hooks/useAttachments"

/**
 * Últimos arquivos da obra, na Visão geral (Telas §10).
 *
 * Só leitura e só os quatro mais recentes: o upload e a lista cheia moram em
 * Documentos, e repetir a zona de envio aqui daria dois lugares para a mesma
 * ação. O tamanho do arquivo que o protótipo mostra não vem da API — o que ela
 * expõe é a data, que fica no lugar dele.
 */

const RECENT_LIMIT = 4

const iconWrap = tv({
  base: "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
  variants: {
    kind: {
      image: "bg-ok-bg text-ok",
      document: "bg-tint text-gold-bright",
    },
  },
})

function iconFor(fileType: string): { Icon: LucideIcon; kind: "image" | "document" } {
  if (isImageMime(fileType)) return { Icon: FileImage, kind: "image" }
  return { Icon: FileText, kind: "document" }
}

export function DocumentosRecentes({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const { attachments, isLoading } = useAttachments(projectId)

  const recent = useMemo(
    () =>
      [...attachments]
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        .slice(0, RECENT_LIMIT),
    [attachments],
  )

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-surface-container-high" />
        ))}
      </div>
    )
  }

  if (recent.length === 0) {
    return <p className="py-6 text-center text-sm text-on-surface-variant">{t("obra.visaoGeral.noDocs")}</p>
  }

  return (
    <ul className="divide-y divide-outline-variant">
      {recent.map((file) => {
        const { Icon, kind } = iconFor(file.fileType)
        return (
          <li key={file.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className={iconWrap({ kind })}>
              <Icon size={15} strokeWidth={1.7} />
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-on-surface">
              {file.fileName}
            </span>
            <Num className="shrink-0 text-[11px] text-on-surface-faint">
              {formatDate(file.uploadedAt)}
            </Num>
          </li>
        )
      })}
    </ul>
  )
}
