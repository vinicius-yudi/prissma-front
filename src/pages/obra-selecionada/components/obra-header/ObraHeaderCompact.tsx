import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { ProjectDeadline } from "@/pages/projetos/components/ProjectDeadline"
import { Fachada } from "@/shared/components/ui/fachada/Fachada"
import { estimateFloors, roofFor } from "@/shared/components/ui/fachada/fachadaGeometry"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { SPRING } from "@/shared/constants/motion"
import type { Project } from "@/shared/types/project"

import type { ObraHeaderData } from "../../hooks/useObraHeader"
import { ProjectStatusMenu } from "./ProjectStatusMenu"

const percent = tv({
  base: "t-kpi text-[18px]",
  variants: { late: { true: "text-danger", false: "text-ink" } },
})

const budgetValue = tv({
  base: "t-num mt-0.5 text-[14px] font-[620]",
  variants: { exceeded: { true: "text-danger", false: "text-ink" } },
})

interface ObraHeaderCompactProps {
  project: Project
  data: ObraHeaderData
  canManage: boolean
}

/**
 * Barra compacta dos módulos: fachada miniatura, título `t-title-sm`, status,
 * trena fina, prazo e orçamento. Título e fachada chegam aqui animados a
 * partir do cabeçalho grande.
 */
export function ObraHeaderCompact({ project, data, canManage }: ObraHeaderCompactProps) {
  const { t } = useTranslation()
  const progress = data.progress.progress ?? 0

  return (
    <motion.section
      layoutId="obra-head"
      transition={SPRING}
      className="relative flex flex-col gap-4 overflow-hidden rounded-[18px] bg-surface p-3 pr-5 hairline sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="blueprint-fine hidden w-[104px] flex-none rounded-[12px] bg-raised px-1.5 pt-1.5 sm:block">
          <motion.div layoutId="obra-elev" transition={SPRING}>
            <Fachada
              progress={progress}
              seed={project.id}
              floors={estimateFloors(project.builtArea, project.landArea)}
              roof={roofFor(project.projectType)}
              showDims={false}
              className="w-full"
            />
          </motion.div>
        </div>
        <div className="min-w-0 pl-2 sm:pl-0">
          <motion.h1 layoutId="obra-title" transition={SPRING} className="t-title-sm truncate text-[24px] text-ink sm:text-[28px]">
            {project.title}
          </motion.h1>
          <div className="mt-1.5 flex items-center gap-2">
            <ProjectStatusMenu project={project} canEdit={canManage} />
            <span className="truncate text-[12.5px] text-meta">{[project.neighborhood, project.city].filter(Boolean).join(", ")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3 px-2 pb-1 sm:flex sm:items-center sm:gap-7 sm:px-0 sm:pb-0">
        <div className="col-span-2 sm:w-[190px]">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-meta">{t("projects.card.progress")}</span>
            <span className={percent({ late: data.pace?.tone === "late" })}>
              {data.progress.progress === null ? "—" : `${progress}%`}
            </span>
          </div>
          <Progress value={progress} expected={data.expected} height={7} className="mt-1.5" label={t("projects.card.progress")} />
        </div>
        <div>
          <p className="text-[12px] text-meta">{t("obra.header.deadline")}</p>
          <ProjectDeadline project={project} className="mt-0.5 block text-[14px] font-[620]" />
        </div>
        <div>
          <p className="text-[12px] text-meta">{t("obra.header.budget")}</p>
          <p className={budgetValue({ exceeded: !!data.budget?.exceeded })}>
            {data.budget ? t("obra.header.budgetUsedShort", { percent: data.budget.percent }) : "—"}
          </p>
        </div>
      </div>
    </motion.section>
  )
}
