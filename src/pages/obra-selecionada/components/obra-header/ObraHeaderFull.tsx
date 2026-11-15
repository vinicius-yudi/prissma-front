import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { AvatarStack } from "@/shared/components/ui/avatar/AvatarStack"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { Fachada } from "@/shared/components/ui/fachada/Fachada"
import { estimateFloors, roofFor } from "@/shared/components/ui/fachada/fachadaGeometry"
import { SPRING } from "@/shared/constants/motion"
import type { Project } from "@/shared/types/project"
import { formatObraCode } from "@/shared/utils/formatters"

import type { ObraHeaderData } from "../../hooks/useObraHeader"
import { RowMenu } from "../orcamento/RowMenu"
import { ObraAddress } from "./ObraAddress"
import { CATEGORY_KEY, PROJECT_TYPE_KEY } from "./obraHeaderText"
import { ObraHeaderStats } from "./ObraHeaderStats"
import { ObraSiteMap } from "./ObraSiteMap"
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
 * prancha, com a planta de situação (Google Maps) no canto. Editar e excluir ficam no "⋮" para não competir com o título. Título e fachada têm `layoutId` e animam até a forma compacta.
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
          <div className="flex items-center justify-between gap-3">
            <ProjectStatusMenu project={project} canEdit={canManage} />
            {canManage && (
              <RowMenu
                label={t("obra.header.actions")}
                editLabel={t("obra.edit")}
                deleteLabel={t("obra.delete")}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            )}
          </div>

          <motion.h1 layoutId="obra-title" transition={SPRING} className="t-title-lg mt-4 text-[clamp(30px,4vw,52px)] text-ink">
            {project.title}
          </motion.h1>
          <DimensionLine
            className="mt-3"
            measure={t("obra.header.builtArea", { built: project.builtArea, land: project.landArea })}
          >
            {[formatObraCode(project.id), typeKey && t(typeKey), categoryKey && t(categoryKey)].filter(Boolean).join(" · ")}
          </DimensionLine>
          <ObraAddress project={project} />

          <ObraHeaderStats data={data} />
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
          <ObraSiteMap project={project} className="absolute top-4 left-4 z-10 hidden sm:block" />
          {data.members.length > 0 && (
            <div
              role="img"
              aria-label={t("obra.header.people", { count: data.members.length })}
              title={t("obra.header.people", { count: data.members.length })}
              className="absolute top-4 right-4"
            >
              <AvatarStack people={data.members} size={30} max={5} />
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}
