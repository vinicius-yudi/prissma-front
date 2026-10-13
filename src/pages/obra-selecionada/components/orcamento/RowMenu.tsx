import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { KeyboardEvent } from "react"

import { IconButton } from "@/shared/components/ui/icon-button/IconButton"
import { SPRING } from "@/shared/constants/motion"

interface RowMenuProps {
  /** Nome acessível do botão "⋮". */
  label: string
  editLabel: string
  deleteLabel: string
  onEdit: () => void
  onDelete: () => void
}

/** Menu "⋮" com editar e excluir — orçamento e categoria usam o mesmo. */
export function RowMenu({ label, editLabel, deleteLabel, onEdit, onDelete }: RowMenuProps) {
  const [open, setOpen] = useState(false)

  function choose(action: () => void) {
    setOpen(false)
    action()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") setOpen(false)
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <IconButton label={label} aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((v) => !v)} className="size-8">
        <MoreVertical size={16} />
      </IconButton>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={SPRING}
              className="absolute top-full right-0 z-20 mt-1 min-w-[190px] rounded-md bg-surface p-1 shadow-lift hairline"
            >
              <button type="button" role="menuitem" onClick={() => choose(onEdit)} className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-[13.5px] text-ink hover:bg-raised">
                <Pencil size={14} />
                {editLabel}
              </button>
              <button type="button" role="menuitem" onClick={() => choose(onDelete)} className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-sm px-2.5 text-left text-[13.5px] text-danger hover:bg-danger-soft">
                <Trash2 size={14} />
                {deleteLabel}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
