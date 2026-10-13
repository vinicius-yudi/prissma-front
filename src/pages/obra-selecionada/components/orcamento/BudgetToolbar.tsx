import { FolderPlus, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import type { ProjectBudget } from "@/shared/types/budget"

import { RowMenu } from "./RowMenu"

interface BudgetToolbarProps {
  budget: ProjectBudget
  canMutate: boolean
  onAddExpense: () => void
  onAddCategory: () => void
  onEditBudget: () => void
  onDeleteBudget: () => void
}

/** Linha de abertura: o que os números são e as ações do orçamento. */
export function BudgetToolbar({ budget, canMutate, onAddExpense, onAddCategory, onEditBudget, onDeleteBudget }: BudgetToolbarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-[60ch] text-[14px] text-ink-2">{budget.description?.trim() || t("obra.orcamento.intro")}</p>
      {canMutate && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" fullWidth={false} onClick={onAddCategory}>
            <FolderPlus size={15} />
            {t("obra.orcamento.actions.addCategory")}
          </Button>
          {budget.items.length > 0 && (
            // No celular quem lança é a ação flutuante.
            <Button size="sm" fullWidth={false} onClick={onAddExpense} className="hidden lg:inline-flex">
              <Plus size={15} />
              {t("obra.orcamento.actions.addExpense")}
            </Button>
          )}
          <RowMenu
            label={t("obra.orcamento.actions.budgetMenu")}
            editLabel={t("obra.orcamento.actions.editBudget")}
            deleteLabel={t("obra.orcamento.actions.deleteBudget")}
            onEdit={onEditBudget}
            onDelete={onDeleteBudget}
          />
        </div>
      )}
    </div>
  )
}
