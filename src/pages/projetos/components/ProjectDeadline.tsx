import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { Project } from "@/shared/types/project"

import { projectDeadline } from "../utils/projectDeadline"

const label = tv({
  base: "t-num text-[12.5px]",
  variants: {
    tone: {
      done: "font-semibold text-success",
      muted: "text-meta",
      late: "font-semibold text-danger",
      soon: "font-semibold text-warning",
      normal: "text-ink-2",
    },
  },
})

interface ProjectDeadlineProps {
  project: Pick<Project, "status" | "plannedEndDate">
  className?: string
}

/** "12 dias restantes", "3 dias além do prazo", "Termina hoje", "Entregue". */
export function ProjectDeadline({ project, className }: ProjectDeadlineProps) {
  const { t } = useTranslation()
  const deadline = projectDeadline(project)

  return <span className={label({ tone: deadline.tone, className })}>{t(deadline.key, { count: deadline.count })}</span>
}
