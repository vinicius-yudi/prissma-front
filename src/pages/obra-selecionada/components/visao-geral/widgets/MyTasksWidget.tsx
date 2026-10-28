import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { getMyTasks } from "@/pages/dashboard/services/myTasks.service"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatDate } from "@/shared/utils/formatters"

import { SectionCard } from "../SectionCard"
import { WidgetSkeleton } from "./WidgetSkeleton"

const MAX = 5

/**
 * As tarefas abertas do usuário NESTA obra, mais urgentes primeiro. Usa a
 * mesma chave da Home (`["me", "tasks"]`): abrir uma tela aproveita o cache da
 * outra.
 */
export function MyTasksWidget({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  const query = useQuery({ queryKey: ["me", "tasks"], queryFn: getMyTasks })

  const open = (query.data ?? [])
    .filter((task) => task.projectId === projectId && task.status !== "DONE")
    .sort((a, b) => (a.plannedEndDate ?? "9999").localeCompare(b.plannedEndDate ?? "9999"))

  return (
    <SectionCard
      title={t("obra.visaoGeral.widgets.my-tasks.title")}
      meta={query.isSuccess ? open.length : undefined}
      action={{ to: `/obras/${projectId}/tarefas`, label: t("obra.visaoGeral.widgets.my-tasks.action") }}
    >
      {query.isLoading ? (
        <WidgetSkeleton />
      ) : query.isError ? (
        <p className="text-[14px] text-danger">{t("obra.visaoGeral.widgets.loadError")}</p>
      ) : open.length === 0 ? (
        <p className="text-[14px] text-ink-2">{t("obra.visaoGeral.widgets.my-tasks.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {open.slice(0, MAX).map((task) => (
            <li key={task.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-[580] text-ink">{task.title}</p>
                <p className="t-num text-[12px] text-meta">
                  {task.stageName}
                  {task.plannedEndDate && ` · ${formatDate(task.plannedEndDate)}`}
                </p>
              </div>
              <StatusBadge status={task.status} plannedEndDate={task.plannedEndDate} kind="task" className="flex-none" />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
