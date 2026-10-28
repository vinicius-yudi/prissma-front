import { Plus, RotateCcw, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

interface CustomizeBarProps {
  editing: boolean
  dirty: boolean
  isSaving: boolean
  onStart: () => void
  onAdd: () => void
  onRestore: () => void
  onCancel: () => void
  onSave: () => void
}

/**
 * Fora da edição: só o botão "Personalizar", discreto, à direita. Na edição:
 * a barra fixa no topo com Adicionar · Restaurar padrão · Cancelar · Salvar.
 */
export function CustomizeBar({ editing, dirty, isSaving, onStart, onAdd, onRestore, onCancel, onSave }: CustomizeBarProps) {
  const { t } = useTranslation()

  if (!editing) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" size="sm" fullWidth={false} onClick={onStart}>
          <SlidersHorizontal size={15} />
          {t("obra.visaoGeral.customize.start")}
        </Button>
      </div>
    )
  }

  return (
    <div
      role="toolbar"
      aria-label={t("obra.visaoGeral.customize.toolbar")}
      className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-lg bg-raised px-4 py-3 shadow-lg hairline"
    >
      <div className="mr-auto min-w-0">
        <p className="t-section text-[15px] text-ink">{t("obra.visaoGeral.customize.title")}</p>
        <p className="text-[12.5px] text-meta">{t("obra.visaoGeral.customize.hint")}</p>
      </div>
      <Button variant="outline" size="sm" fullWidth={false} onClick={onAdd}>
        <Plus size={15} />
        {t("obra.visaoGeral.customize.add")}
      </Button>
      <Button variant="ghost" size="sm" fullWidth={false} onClick={onRestore}>
        <RotateCcw size={14} />
        {t("obra.visaoGeral.customize.restore")}
      </Button>
      <Button variant="outline" size="sm" fullWidth={false} onClick={onCancel} disabled={isSaving}>
        {t("obra.visaoGeral.customize.cancel")}
      </Button>
      <Button variant="primary" size="sm" fullWidth={false} onClick={onSave} disabled={isSaving}>
        {isSaving
          ? t("obra.visaoGeral.customize.saving")
          : dirty
            ? t("obra.visaoGeral.customize.save")
            : t("obra.visaoGeral.customize.done")}
      </Button>
    </div>
  )
}
