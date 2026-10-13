import { useTranslation } from "react-i18next"

import type { BudgetItem, Expense } from "@/shared/types/budget"

import type { Stage } from "../../services/stages.service"
import { ExpensesTableBody } from "./ExpensesTableBody"

/** A tabela mostra os mais recentes; o resto fica a um filtro de distância. */
const MAX_ROWS = 40

interface ExpensesTableProps {
  expenses: Expense[]
  items: BudgetItem[]
  stages: Stage[]
  /** Categoria filtrada, para o botão de voltar a todas. */
  filtered: boolean
  isLoading: boolean
  canMutate: boolean
  onClearFilter: () => void
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/** Lançamentos, do mais recente ao mais antigo. */
export function ExpensesTable(props: ExpensesTableProps) {
  const { t } = useTranslation()
  const categoryById = new Map(props.items.map((item) => [item.id, item.category]))
  const stageById = new Map(props.stages.map((stage) => [stage.id, stage.name]))
  const rows = [...props.expenses].sort((a, b) => b.spentAt.localeCompare(a.spentAt)).slice(0, MAX_ROWS)

  return (
    <section className="overflow-hidden rounded-lg bg-surface hairline">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
        <div className="flex items-baseline gap-2">
          <h2 className="t-section text-ink">{t("obra.orcamento.expenses.title")}</h2>
          <span className="t-data text-meta">{props.expenses.length}</span>
        </div>
        {props.filtered && (
          <button type="button" onClick={props.onClearFilter} className="cursor-pointer text-[13px] font-[620] text-gold-hi hover:underline">
            {t("obra.orcamento.expenses.showAll")}
          </button>
        )}
      </div>

      <ExpensesTableBody
        rows={rows}
        isLoading={props.isLoading}
        categoryById={categoryById}
        stageById={stageById}
        canMutate={props.canMutate}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
    </section>
  )
}
