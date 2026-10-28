import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Drawer } from "@/shared/components/ui/drawer/Drawer"

import type { WidgetPlacement } from "./layoutModel"

interface WidgetCatalogProps {
  open: boolean
  /** Widgets ocultos que o perfil pode ver — já filtrados pela matriz de acesso. */
  hidden: WidgetPlacement[]
  onAdd: (id: string) => void
  onClose: () => void
}

/** Gaveta "Adicionar widget": o que está fora da tela, com título e para que serve. */
export function WidgetCatalog({ open, hidden, onAdd, onClose }: WidgetCatalogProps) {
  const { t } = useTranslation()

  return (
    <Drawer open={open} onClose={onClose} label={t("obra.visaoGeral.customize.catalogTitle")} width={420}>
      <div className="flex h-full flex-col gap-5 overflow-y-auto p-6">
        <div>
          <h2 className="t-section text-ink">{t("obra.visaoGeral.customize.catalogTitle")}</h2>
          <p className="mt-1 text-[13.5px] text-ink-2">{t("obra.visaoGeral.customize.catalogHint")}</p>
        </div>

        {hidden.length === 0 ? (
          <p className="text-[14px] text-meta">{t("obra.visaoGeral.customize.catalogEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            {hidden.map((widget) => (
              <li key={widget.id} className="flex items-start gap-3 rounded-lg bg-raised p-4 hairline">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-[620] text-ink">{t(`obra.visaoGeral.widgets.${widget.id}.title`)}</p>
                  <p className="mt-0.5 text-[13px] text-ink-2">{t(`obra.visaoGeral.widgets.${widget.id}.description`)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onClick={() => onAdd(widget.id)}
                  aria-label={t("obra.visaoGeral.customize.addOne", {
                    title: t(`obra.visaoGeral.widgets.${widget.id}.title`),
                  })}
                >
                  <Plus size={15} />
                  {t("obra.visaoGeral.customize.addShort")}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </Drawer>
  )
}
