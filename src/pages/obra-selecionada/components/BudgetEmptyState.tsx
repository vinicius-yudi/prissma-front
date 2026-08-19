import { Coins, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

interface BudgetEmptyStateProps {
  canMutate: boolean
  onCreate: () => void
}

export function BudgetEmptyState({ canMutate, onCreate }: BudgetEmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-surface-container-low rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4 border border-outline-variant/20">
      <div className="p-4 rounded-2xl bg-primary/10 text-primary">
        <Coins size={28} />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-on-surface">
          {t("obra.orcamento.empty.title")}
        </h2>
        <p className="text-sm text-on-surface-variant max-w-md">
          {t("obra.orcamento.empty.description")}
        </p>
      </div>
      {canMutate && (
        <Button onClick={onCreate} className="w-auto px-5 py-2.5 text-sm">
          <Plus size={16} />
          {t("obra.orcamento.empty.cta")}
        </Button>
      )}
    </div>
  )
}
