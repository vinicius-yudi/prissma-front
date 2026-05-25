import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

interface BudgetErrorStateProps {
  onRetry: () => void
}

export function BudgetErrorState({ onRetry }: BudgetErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 bg-surface-container-low rounded-xl border border-error/20">
      <p className="text-on-surface-variant text-sm">
        {t("obra.orcamento.errors.loadFailed")}
      </p>
      <Button variant="outline" onClick={onRetry} className="w-auto px-4 py-2 text-sm">
        <RefreshCw size={14} />
        {t("obra.retry")}
      </Button>
    </div>
  )
}
