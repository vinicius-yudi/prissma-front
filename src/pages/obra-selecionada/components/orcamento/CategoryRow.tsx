import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Progress, type ProgressTone } from "@/shared/components/ui/progress/Progress"
import type { BudgetItem } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { calculatePercent, resolveBudgetTone, type BudgetTone } from "../../utils/budgetMath"
import { RowMenu } from "./RowMenu"

const TAPE: Record<BudgetTone, ProgressTone> = { ok: "gold", warning: "warn", exceeded: "danger" }

const pick = tv({
  base: "w-full min-w-0 cursor-pointer rounded-[10px] text-left transition-opacity",
  variants: { dimmed: { true: "opacity-45 hover:opacity-80" } },
})

const dot = tv({
  base: "size-2 flex-none rounded-full",
  variants: { tone: { ok: "bg-gold", warning: "bg-warning", exceeded: "bg-danger" } },
})

interface CategoryRowProps {
  item: BudgetItem
  /** Outra categoria está filtrando a tabela. */
  dimmed: boolean
  selected: boolean
  canMutate: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

/**
 * Categoria com a trena: âmbar acima de 85%, perigo quando estoura — e aí
 * diz quanto passou. Clicar filtra os lançamentos por ela.
 */
export function CategoryRow({ item, dimmed, selected, canMutate, onSelect, onEdit, onDelete }: CategoryRowProps) {
  const { t } = useTranslation()
  const percent = calculatePercent(item.totalSpent, item.plannedAmount)
  const tone = resolveBudgetTone(percent, item.exceeded)
  const over = item.totalSpent - item.plannedAmount

  return (
    <li className="flex items-start gap-1">
      <button type="button" onClick={onSelect} aria-pressed={selected} className={pick({ dimmed })}>
        <span className="flex items-baseline justify-between gap-3 text-[13.5px]">
          <span className="inline-flex min-w-0 items-center gap-2 font-[580] text-ink">
            <span className={dot({ tone })} />
            <span className="truncate">{item.category}</span>
          </span>
          <span className="t-num flex-none text-[12.5px] text-ink-2">
            {formatCurrency(item.totalSpent)} <span className="text-meta">/ {formatCurrency(item.plannedAmount)}</span>
          </span>
        </span>
        <Progress value={percent} height={7} tone={TAPE[tone]} label={item.category} className="mt-2" />
        {tone === "exceeded" && (
          <span className="mt-1.5 block text-[12px] font-[620] text-danger">
            {t("obra.orcamento.category.over", { value: formatCurrency(over) })}
          </span>
        )}
      </button>
      {canMutate && (
        <RowMenu
          label={t("obra.orcamento.category.menu", { name: item.category })}
          editLabel={t("obra.orcamento.actions.editCategory")}
          deleteLabel={t("obra.orcamento.actions.deleteCategory")}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </li>
  )
}
