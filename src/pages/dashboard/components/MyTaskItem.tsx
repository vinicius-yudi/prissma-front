import { CalendarDays, FolderKanban } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"

import type { DashboardTask } from "../types"

const statusBadge = tv({
  base: "inline-flex shrink-0 items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border whitespace-nowrap",
  variants: {
    status: {
      TODO: "bg-surface-container-highest text-on-surface-variant border-outline-variant/30",
      IN_PROGRESS: "bg-secondary-container/20 text-secondary border-secondary/20",
      DONE: "bg-primary-container/20 text-primary border-primary/20",
      BLOCKED: "bg-error-container/20 text-error border-error/20",
    },
  },
  defaultVariants: { status: "TODO" },
})

function formatDate(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString("pt-BR")
}

interface MyTaskItemProps {
  task: DashboardTask
}

export function MyTaskItem({ task }: MyTaskItemProps) {
  const { t } = useTranslation()

  return (
    <Link
      to={`/obras/${task.projectId}`}
      className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <div className="min-w-0">
        <p className="truncate font-semibold text-on-surface">{task.title}</p>
        {task.projectTitle && (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-on-surface-variant">
            <FolderKanban size={12} className="shrink-0" />
            {task.projectTitle}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={statusBadge({ status: task.status })}>
          {t(`dashboard.taskStatus.${task.status}`)}
        </span>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant tabular-nums">
          <CalendarDays size={12} className="shrink-0" />
          {formatDate(task.plannedEndDate)}
        </span>
      </div>
    </Link>
  )
}
