import { AlertTriangle, Ban, CalendarClock } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { AlertRow } from "@/shared/components/ui/alert-row/AlertRow"
import { AttentionCard } from "@/shared/components/ui/alert-row/AttentionCard"
import { STAGGER } from "@/shared/constants/motion"

import type { Alert } from "../utils/dashboardData"

const ICON: Record<Alert["kind"], LucideIcon> = {
  task: AlertTriangle,
  blocked: Ban,
  project: CalendarClock,
}

const META_KEY: Record<Alert["kind"], string> = {
  task: "dashboard.alerts.taskLate",
  blocked: "dashboard.alerts.taskBlocked",
  project: "dashboard.alerts.projectLate",
}

/** Máximo de linhas: o resto está a um clique, na aba de cada obra. */
const MAX_ROWS = 6

/** "Precisa da sua atenção" do Início, ordenado por gravidade. */
export function DashboardAttention({ alerts }: { alerts: Alert[] }) {
  const { t } = useTranslation()

  return (
    <AttentionCard
      heading={t("dashboard.attentionHeading", { count: alerts.length })}
      count={alerts.length}
      emptyText={t("dashboard.attentionEmpty")}
    >
      {alerts.slice(0, MAX_ROWS).map((alert, index) => {
        const Icon = ICON[alert.kind]
        return (
          <motion.div
            key={alert.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * STAGGER }}
          >
            <AlertRow
              tone="danger"
              icon={<Icon size={16} />}
              title={alert.title}
              meta={t(META_KEY[alert.kind], { project: alert.projectTitle, count: alert.daysLate })}
              to={alert.to}
            />
          </motion.div>
        )
      })}
    </AttentionCard>
  )
}
