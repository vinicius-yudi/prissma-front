import { Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

interface TaskQuickAddProps {
  /** Nome da etapa onde a tarefa vai nascer — dito na dica. */
  stageName: string
  isSaving: boolean
  onAdd: (title: string) => Promise<unknown>
}

/**
 * Adição rápida no pé da coluna: só o título, Enter salva e o campo fica
 * aberto para a próxima; Esc fecha. O resto se ajusta depois no drawer.
 */
export function TaskQuickAdd({ stageName, isSaving, onAdd }: TaskQuickAddProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  function close() {
    setOpen(false)
    setValue("")
  }

  function submit() {
    const title = value.trim()
    if (!title || isSaving) return
    onAdd(title).then(() => setValue(""), () => undefined)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") submit()
    if (event.key === "Escape") {
      event.stopPropagation()
      close()
    }
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      {open ? (
        <motion.div key="form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="mt-2 rounded-[13px] bg-surface p-2 inset-ring-2 inset-ring-gold">
            <input
              // Abre por ação do usuário: o foco vai direto para o campo.
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("obra.tarefas.quickAdd.placeholder")}
              aria-label={t("obra.tarefas.quickAdd.label")}
              className="h-9 w-full bg-transparent px-1.5 text-[14px] text-ink outline-none placeholder:text-ink-3"
            />
            <p className="px-1.5 text-[11.5px] text-meta">{t("obra.tarefas.quickAdd.hint", { stage: stageName })}</p>
            <div className="mt-2 flex justify-end gap-1">
              <Button size="sm" variant="ghost" fullWidth={false} onClick={close}>
                {t("obra.tarefas.cancel")}
              </Button>
              <Button size="sm" fullWidth={false} onClick={submit} disabled={!value.trim() || isSaving}>
                {t("obra.tarefas.quickAdd.submit")}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.button
          key="open"
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setOpen(true)}
          className="mt-2 flex h-10 w-full cursor-pointer items-center gap-2 rounded-[11px] px-2.5 text-[13px] text-meta transition-colors hover:bg-surface hover:text-ink"
        >
          <Plus size={14} />
          {t("obra.tarefas.quickAdd.open")}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
