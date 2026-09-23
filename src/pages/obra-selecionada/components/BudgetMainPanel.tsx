import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import type { ProjectBudget } from "@/shared/types/budget"

import { BudgetHeaderMenu } from "./BudgetHeaderMenu"
import { BudgetKpiStrip } from "./BudgetKpiStrip"

interface BudgetMainPanelProps {
  budget: ProjectBudget
  canMutate: boolean
  onAddItem: () => void
  onEditBudget: () => void
  onDeleteBudget: () => void
}

export function BudgetMainPanel({
  budget,
  canMutate,
  onAddItem,
  onEditBudget,
  onDeleteBudget,
}: BudgetMainPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-surface-container-low rounded-xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-on-surface">
            {t("obra.orcamento.title")}
          </h2>
          {budget.description && (
            <p className="text-sm text-on-surface-variant mt-0.5 truncate">
              {budget.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canMutate && (
            <Button
              onClick={onAddItem}
              variant="primary"
              // No celular quem cria é o FAB da barra de abas.
              className="hidden w-auto px-3 py-2 text-xs sm:text-sm lg:inline-flex"
            >
              <Plus size={14} />
              {t("obra.orcamento.actions.addCategory")}
            </Button>
          )}
          {canMutate && <BudgetHeaderMenu onEdit={onEditBudget} onDelete={onDeleteBudget} />}
        </div>
      </div>

      <BudgetKpiStrip budget={budget} />
    </div>
  )
}
