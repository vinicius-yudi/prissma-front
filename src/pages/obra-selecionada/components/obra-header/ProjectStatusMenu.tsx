import { Check, ChevronDown } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { SPRING } from "@/shared/constants/motion"
import { ProjectStatus } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"

import { useProjectStatus } from "../../hooks/useProjectStatus"

const OPTIONS: ProjectStatus[] = [
  ProjectStatus.PLANNING,
  ProjectStatus.IN_PROGRESS,
  ProjectStatus.PAUSED,
  ProjectStatus.COMPLETED,
]

const chevron = tv({
  base: "text-ink-3 transition-transform",
  variants: { open: { true: "rotate-180" } },
})

interface ProjectStatusMenuProps {
  project: Project
  /** Sem MANAGE_PROJECT o status é só leitura. */
  canEdit: boolean
}

/** Status da obra no cabeçalho; quem gerencia troca por aqui, com Desfazer. */
export function ProjectStatusMenu({ project, canEdit }: ProjectStatusMenuProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { changeStatus, isChanging } = useProjectStatus(project.id)

  const badge = <StatusBadge status={project.status} plannedEndDate={project.plannedEndDate} kind="project" />
  if (!canEdit) return badge

  function choose(status: ProjectStatus) {
    setOpen(false)
    if (status !== project.status) changeStatus(status, project.status)
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") setOpen(false)
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        disabled={isChanging}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("obra.header.changeStatus")}
        className="inline-flex cursor-pointer items-center gap-1 rounded-pill disabled:opacity-60"
      >
        {badge}
        <ChevronDown size={14} className={chevron({ open })} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" aria-hidden="true" onClick={() => setOpen(false)} />
            <motion.ul
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={SPRING}
              className="absolute top-full left-0 z-40 mt-2 w-52 origin-top-left rounded-[12px] bg-surface p-1.5 shadow-lift hairline"
            >
              {OPTIONS.map((status) => (
                <li key={status}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={status === project.status}
                    onClick={() => choose(status)}
                    className="flex h-9 w-full cursor-pointer items-center justify-between rounded-[8px] px-2.5 text-[13.5px] text-ink hover:bg-raised"
                  >
                    {t(`status.${status}`)}
                    {status === project.status && <Check size={15} className="text-gold-hi" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
