import { Coins, Plus, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { useProjectProgress } from "@/pages/projetos/hooks/useProjectProgress"
import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { ProjectStatus, type Project } from "@/shared/types/project"

import { useBudget } from "../hooks/useBudget"
import { useBudgetExpenses } from "../hooks/useBudgetExpenses"
import { useBudgetModals } from "../hooks/useBudgetModals"
import { useStagesList } from "../hooks/useStages"
import { buildCurve } from "../utils/sCurve"
import { BudgetKpis } from "./orcamento/BudgetKpis"
import { BudgetModals } from "./orcamento/BudgetModals"
import { BudgetToolbar } from "./orcamento/BudgetToolbar"
import { CategoryPanel } from "./orcamento/CategoryPanel"
import { ExpensesTable } from "./orcamento/ExpensesTable"
import { SCurve } from "./orcamento/SCurve"
import { SectionCard } from "./visao-geral/SectionCard"

/** `?categoria=<id>` filtra os lançamentos (CLAUDE.md §8). */
const CATEGORY_PARAM = "categoria"

interface OrcamentoTabProps {
  project: Pick<Project, "id" | "status" | "plannedStartDate" | "plannedEndDate">
}

/**
 * Orçamento (redesign): KPIs com projeção, curva de gastos contra a curva S
 * planejada, uma trena por categoria e a tabela de lançamentos.
 */
export function OrcamentoTab({ project }: OrcamentoTabProps) {
  const { t } = useTranslation()
  const ops = useBudget(project.id)
  const { budget } = ops
  const modals = useBudgetModals()
  const { stages } = useStagesList(project.id)
  const { expenses, isLoading: expensesLoading } = useBudgetExpenses(project.id, budget?.id ?? null)
  const { progress } = useProjectProgress(project.id)
  const [params, setParams] = useSearchParams()

  const selectedId = Number(params.get(CATEGORY_PARAM)) || null
  const selected = budget?.items.find((item) => item.id === selectedId) ?? null
  const hasItems = (budget?.items.length ?? 0) > 0

  function selectCategory(id: number | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === null) next.delete(CATEGORY_PARAM)
        else next.set(CATEGORY_PARAM, String(id))
        return next
      },
      { replace: true },
    )
  }

  function primaryAction() {
    if (!ops.canMutate) return null
    if (!budget) return { label: t("obra.orcamento.empty.cta"), onClick: modals.openBudgetForm }
    if (!hasItems) return { label: t("obra.orcamento.actions.addCategory"), onClick: () => modals.openItemForm() }
    return { label: t("obra.orcamento.actions.addExpense"), onClick: () => modals.openExpenseForm() }
  }

  // Antes dos early returns: alimenta a ação flutuante do celular.
  usePrimaryAction(primaryAction())

  const dialogs = <BudgetModals ops={ops} modals={modals} budget={budget} stages={stages} selectedItemId={selected?.id ?? null} />

  if (ops.isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-[120px] animate-pulse rounded-lg bg-surface hairline" />
        <div className="h-[300px] animate-pulse rounded-lg bg-surface hairline" />
      </div>
    )
  }

  if (ops.isError) {
    return (
      <EmptyState
        title={t("obra.orcamento.errors.loadFailed")}
        action={
          <Button variant="outline" fullWidth={false} onClick={() => ops.refetch()}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        }
      />
    )
  }

  if (!budget) {
    return (
      <>
        <EmptyState
          icon={<Coins size={26} />}
          title={t("obra.orcamento.empty.title")}
          body={t("obra.orcamento.empty.description")}
          action={
            ops.canMutate && (
              <Button fullWidth={false} onClick={modals.openBudgetForm}>
                <Plus size={15} />
                {t("obra.orcamento.empty.cta")}
              </Button>
            )
          }
        />
        {dialogs}
      </>
    )
  }

  const curve = buildCurve({ start: project.plannedStartDate, end: project.plannedEndDate }, budget.plannedTotal, expenses)
  const visibleExpenses = selected ? expenses.filter((e) => e.budgetItemId === selected.id) : expenses

  return (
    <div className="flex flex-col gap-6">
      <BudgetToolbar
        budget={budget}
        canMutate={ops.canMutate}
        onAddExpense={() => modals.openExpenseForm()}
        onAddCategory={() => modals.openItemForm()}
        onEditBudget={modals.openBudgetForm}
        onDeleteBudget={() => modals.requestDelete({ kind: "budget", id: budget.id })}
      />

      <BudgetKpis budget={budget} progress={project.status === ProjectStatus.IN_PROGRESS ? progress : null} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <SectionCard title={t("obra.orcamento.curve.title")}>
          {curve ? <SCurve curve={curve} planned={budget.plannedTotal} /> : <p className="py-8 text-center text-[14px] text-meta">{t("obra.orcamento.curve.noDates")}</p>}
        </SectionCard>
        <CategoryPanel
          items={budget.items}
          selectedId={selected?.id ?? null}
          canMutate={ops.canMutate}
          onSelect={selectCategory}
          onCreate={() => modals.openItemForm()}
          onEdit={(item) => modals.openItemForm(item)}
          onDelete={(item) => modals.requestDelete({ kind: "item", id: item.id, name: item.category })}
        />
      </div>

      <ExpensesTable
        expenses={visibleExpenses}
        items={budget.items}
        stages={stages}
        filtered={selected !== null}
        isLoading={expensesLoading}
        canMutate={ops.canMutate}
        onClearFilter={() => selectCategory(null)}
        onEdit={(expense) => modals.openExpenseForm(expense)}
        onDelete={ops.removeExpense}
      />

      {dialogs}
    </div>
  )
}
