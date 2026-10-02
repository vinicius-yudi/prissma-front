import { CalendarClock, Wallet } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import { AlertRow } from "@/shared/components/ui/alert-row/AlertRow"
import { AttentionCard } from "@/shared/components/ui/alert-row/AttentionCard"
import { STAGGER } from "@/shared/constants/motion"
import type { BudgetItem } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

/** Categoria acima disso do planejado entra como alerta (DS v2, Estados). */
const NEAR_LIMIT = 0.85

interface OverviewAttentionProps {
  projectId: number
  stages: StageSummary[]
  budgetItems: BudgetItem[]
}

interface Attention {
  key: string
  tone: "danger" | "warning"
  icon: typeof Wallet
  title: string
  meta: string
  to: string
  weight: number
}

/**
 * "N pontos precisam de decisão" da obra: etapas vencidas, categorias
 * estouradas e categorias acima de 85%. Cada linha leva à aba onde se resolve.
 */
export function OverviewAttention({ projectId, stages, budgetItems }: OverviewAttentionProps) {
  const { t } = useTranslation()
  const base = `/obras/${projectId}`

  const items: Attention[] = [
    ...stages
      .filter((s) => s.daysLate > 0)
      .map((s) => ({
        key: `stage-${s.id}`,
        tone: "danger" as const,
        icon: CalendarClock,
        title: t("obra.visaoGeral.attention.stageLate", { name: s.name }),
        meta: t("obra.visaoGeral.attention.daysLate", { count: s.daysLate }),
        to: `${base}/etapas`,
        weight: 10 + s.daysLate,
      })),
    ...budgetItems
      .filter((item) => item.exceeded)
      .map((item) => ({
        key: `over-${item.id}`,
        tone: "danger" as const,
        icon: Wallet,
        title: t("obra.visaoGeral.attention.categoryOver", { category: item.category }),
        meta: t("obra.visaoGeral.attention.overBy", {
          over: formatCurrency(item.totalSpent - item.plannedAmount),
          planned: formatCurrency(item.plannedAmount),
        }),
        to: `${base}/orcamento`,
        weight: 9,
      })),
    ...budgetItems
      .filter((item) => !item.exceeded && item.plannedAmount > 0 && item.totalSpent / item.plannedAmount > NEAR_LIMIT)
      .map((item) => ({
        key: `near-${item.id}`,
        tone: "warning" as const,
        icon: Wallet,
        title: t("obra.visaoGeral.attention.categoryNear", { category: item.category }),
        meta: t("obra.visaoGeral.attention.used", { percent: Math.round((item.totalSpent / item.plannedAmount) * 100) }),
        to: `${base}/orcamento`,
        weight: 2,
      })),
  ].sort((a, b) => b.weight - a.weight)

  const decisions = items.filter((item) => item.tone === "danger").length

  return (
    <AttentionCard
      heading={t("dashboard.attentionHeading", { count: decisions || items.length })}
      count={items.length}
      emptyText={t("obra.visaoGeral.attention.empty")}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        return (
          <motion.div key={item.key} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * STAGGER }}>
            <AlertRow tone={item.tone} icon={<Icon size={16} />} title={item.title} meta={item.meta} to={item.to} />
          </motion.div>
        )
      })}
    </AttentionCard>
  )
}
