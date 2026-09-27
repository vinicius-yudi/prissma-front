import { MapPin, Pencil, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { AvatarStack } from "@/shared/components/ui/avatar/AvatarStack"
import { Button } from "@/shared/components/ui/button/Button"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { Fachada } from "@/shared/components/ui/fachada/Fachada"
import { estimateFloors, roofFor } from "@/shared/components/ui/fachada/fachadaGeometry"
import { SPRING } from "@/shared/constants/motion"
import { formatProjectAddress } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"
import { formatDate, formatObraCode } from "@/shared/utils/formatters"

import type { ObraHeaderData } from "../../hooks/useObraHeader"
import { CATEGORY_KEY, PROJECT_TYPE_KEY } from "./obraHeaderText"
import { ObraHeaderStats } from "./ObraHeaderStats"
import { ProjectStatusMenu } from "./ProjectStatusMenu"

interface ObraHeaderFullProps {
  project: Project
  data: ObraHeaderData
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}

/**
 * Cabeçalho grande da Visão geral (DS v2, Tabs): status, nome `t-title-lg`,
 * avanço físico com o esperado para hoje, prazo, orçamento e a fachada em
 * prancha. Título e fachada têm `layoutId` e animam até a forma compacta.
 */
export function ObraHeaderFull({ project, data, canManage, onEdit, onDelete }: ObraHeaderFullProps) {
  const { t } = useTranslation()
  const progress = data.progress.progress ?? 0
  const typeKey = PROJECT_TYPE_KEY[project.projectType]
  const categoryKey = CATEGORY_KEY[project.category]

  return (
    <motion.section
      layoutId="obra-head"
      transition={SPRING}
      className="relative overflow-hidden rounded-xl bg-surface hairline"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <ProjectStatusMenu project={project} canEdit={canManage} />
              {(typeKey || categoryKey) && (
                <span className="inline-flex h-6 items-center rounded-pill bg-raised px-2.5 text-[12px] font-semibold text-ink-2 hairline">
                  {[typeKey && t(typeKey), categoryKey && t(categoryKey)].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
            {canManage && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" fullWidth={false} onClick={onEdit}>
                  <Pencil size={14} />
                  {t("obra.edit")}
                </Button>
                <Button variant="ghost" size="sm" fullWidth={false} onClick={onDelete} className="text-danger">
                  <Trash2 size={14} />
                  {t("obra.delete")}
                </Button>
              </div>
            )}
          </div>

          <motion.h1 layoutId="obra-title" transition={SPRING} className="t-title-lg mt-4 text-[clamp(30px,4vw,52px)] text-ink">
            {project.title}
          </motion.h1>
          <DimensionLine
            className="mt-3"
            measure={t("obra.header.builtArea", { built: project.builtArea, land: project.landArea })}
          >
            {[formatObraCode(project.id), project.plannedStartDate && t("obra.startedAt", { date: formatDate(project.plannedStartDate) })]
              .filter(Boolean)
              .join(" · ")}
          </DimensionLine>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-ink-3" />
              {formatProjectAddress(project)}
            </span>
          </div>

          <ObraHeaderStats project={project} data={data} />
        </div>

        <div className="blueprint relative flex min-h-[220px] items-end justify-center border-t border-border bg-raised px-6 pt-10 lg:border-t-0 lg:border-l">
          <motion.div layoutId="obra-elev" transition={SPRING} className="w-full max-w-[360px]">
            <Fachada
              progress={progress}
              seed={project.id}
              floors={estimateFloors(project.builtArea, project.landArea)}
              roof={roofFor(project.projectType)}
              className="w-full"
            />
          </motion.div>
          <span className="t-data absolute top-4 left-4 text-[11.5px] text-ink-3">{t("common.facadeScale")}</span>
          {data.members.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
              <AvatarStack people={data.members} size={30} max={5} />
              <span className="text-[12px] text-meta">{t("obra.header.people", { count: data.members.length })}</span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
