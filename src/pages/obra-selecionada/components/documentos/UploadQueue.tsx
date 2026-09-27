import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"

import type { PendingUpload } from "../../hooks/useDocumentos"
import { kindOf } from "../../utils/documentKind"
import { FileSheet } from "./FileSheet"

/**
 * Fila de envio. O `fetch` não reporta progresso de upload, então a barra é
 * indeterminada (listras andando) em vez de um percentual inventado.
 */
export function UploadQueue({ pending }: { pending: PendingUpload[] }) {
  const { t } = useTranslation()

  return (
    <AnimatePresence initial={false}>
      {pending.length > 0 && (
        <motion.ul
          aria-label={t("obra.documentos.uploading")}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 overflow-hidden p-0"
        >
          <AnimatePresence initial={false}>
            {pending.map((item) => (
              <motion.li key={item.key} layout exit={{ opacity: 0 }} className="flex list-none items-center gap-3 rounded-[13px] bg-surface p-3 hairline">
                <FileSheet kind={kindOf({ fileName: item.name, fileType: "" })} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-[13.5px]">
                    <span className="truncate font-[560] text-ink">{item.name}</span>
                    <span className="flex-none text-[12px] text-meta">{t("obra.documentos.sending")}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-raised" role="progressbar" aria-label={item.name}>
                    <motion.div
                      className="h-full w-1/3 rounded-pill bg-gold"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    />
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </AnimatePresence>
  )
}
