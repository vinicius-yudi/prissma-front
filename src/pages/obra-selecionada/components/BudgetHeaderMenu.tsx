import { useState } from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

interface BudgetHeaderMenuProps {
  onEdit: () => void
  onDelete: () => void
}

export function BudgetHeaderMenu({ onEdit, onDelete }: BudgetHeaderMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
  }

  function handleEdit() {
    close()
    onEdit()
  }

  function handleDelete() {
    close()
    onDelete()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 text-ink-2 hover:text-ink hover:bg-raised rounded-lg transition-colors cursor-pointer"
        aria-label="menu"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] bg-raised rounded-lg border border-border shadow-xl py-1">
            <button
              type="button"
              onClick={handleEdit}
              className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-gold/10 flex items-center gap-2 cursor-pointer"
            >
              <Pencil size={14} />
              {t("obra.orcamento.actions.editBudget")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} />
              {t("obra.orcamento.actions.deleteBudget")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
