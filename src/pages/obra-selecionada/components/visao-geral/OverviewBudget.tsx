import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Donut } from "@/shared/components/ui/donut/Donut"
import { Progress } from "@/shared/components/ui/progress/Progress"
import type { ProjectBudget } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { SectionCard } from "./SectionCard"

/**
 * Tons das fatias por ordem de gasto — ouros e neutros; `danger` só na
 * categoria estourada (se não é problema, não é vermelho).
 */
const SLICE_COLORS = ["var(--gold)", "var(--gold-deep)", "var(--gold-hi)", "var(--ink-3)", "var(--border-strong)"]

const NEAR_LIMIT = 0.85
const TOP = 5

const pct = tv({
  base: "t-num flex-none",
  variants: { exceeded: { true: "font-[640] text-danger", false: "text-ink-2" } },
})

const remainingValue = tv({
  base: "t-num text-[17px] font-[640]",
  variants: { negative: { true: "text-danger", false: "text-ink" } },
})

type Tone = "danger" | "warn" | "gold"

function toneOf(exceeded: boolean, ratio: number): Tone {
  if (exceeded) return "danger"
  if (ratio > NEAR_LIMIT) return "warn"
  return "gold"
}

interface OverviewBudgetProps {
  projectId: number
  budget: ProjectBudget | null
}

/** Resumo do orçamento: anel por categoria, gasto e saldo, as 5 maiores com trena fina. */
export function OverviewBudget({ projectId, budget }: OverviewBudgetProps) {
  const { t } = useTranslation()
  const action = { to: `/obras/${projectId}/orcamento`, label: t("obra.visaoGeral.seeExpenses") }

  if (!budget) {
    return (
      <SectionCard title={t("obra.visaoGeral.budget")} action={action}>
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.noBudget")}</p>
      </SectionCard>
    )
  }

  const spent = [...budget.items].filter((item) => item.totalSpent > 0).sort((a, b) => b.totalSpent - a.totalSpent)
  const used = budget.plannedTotal > 0 ? Math.round((budget.totalSpent / budget.plannedTotal) * 100) : 0

  return (
    <SectionCard title={t("obra.visaoGeral.budget")} action={action}>
      <div className="flex items-center gap-5">
        <Donut
          size={132}
          stroke={16}
          label={t("obra.visaoGeral.budget")}
          segments={spent.map((item, i) => ({
            key: String(item.id),
            value: item.totalSpent,
            color: item.exceeded ? "var(--danger)" : SLICE_COLORS[i % SLICE_COLORS.length],
          }))}
        >
          <span className="t-kpi text-[22px] text-ink">{used}%</span>
          <span className="mt-1 text-[11px] text-meta">{t("obra.visaoGeral.used")}</span>
        </Donut>
        <div className="min-w-0 space-y-2.5">
          <div>
            <p className="text-[12px] text-meta">{t("obra.visaoGeral.spent")}</p>
            <p className="t-num text-[17px] font-[640] text-ink">{formatCurrency(budget.totalSpent)}</p>
          </div>
          <div>
            <p className="text-[12px] text-meta">{t("obra.visaoGeral.remaining")}</p>
            <p className={remainingValue({ negative: budget.remaining < 0 })}>{formatCurrency(budget.remaining)}</p>
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2.5">
        {spent.slice(0, TOP).map((item) => {
          const ratio = item.plannedAmount > 0 ? item.totalSpent / item.plannedAmount : 0
          return (
            <li key={item.id}>
              <div className="flex items-center justify-between gap-2 text-[12.5px]">
                <span className="truncate text-ink">{item.category}</span>
                <span className={pct({ exceeded: item.exceeded })}>{Math.round(ratio * 100)}%</span>
              </div>
              <Progress value={ratio * 100} height={5} tone={toneOf(item.exceeded, ratio)} label={item.category} className="mt-1.5" />
            </li>
          )
        })}
      </ul>
    </SectionCard>
  )
}
