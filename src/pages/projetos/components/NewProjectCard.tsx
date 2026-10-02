import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

/**
 * Último card da grade: "Começar uma nova obra". Tracejado = previsto, a mesma
 * regra da fachada; o + gira no hover.
 */
export function NewProjectCard({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onCreate}
      className="group blueprint flex min-h-[320px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-2 border-dashed border-border-strong text-meta transition-colors hover:border-gold hover:text-gold-hi"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-surface hairline transition-transform duration-300 group-hover:rotate-90 motion-reduce:transition-none">
        <Plus size={22} />
      </span>
      <span className="t-section text-[15px]">{t("projects.newCard.title")}</span>
      <span className="text-[13px]">{t("projects.newCard.body")}</span>
    </button>
  )
}
