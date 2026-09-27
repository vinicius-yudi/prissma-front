import { Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"
import { STAGGER } from "@/shared/constants/motion"
import type { Project } from "@/shared/types/project"

import { ProjectView } from "../types"
import { NewProjectCard } from "./NewProjectCard"
import { ProjectCard } from "./ProjectCard"
import { ProjectRow } from "./ProjectRow"
import { ProjectsLoading } from "./ProjectsLoading"

const layout = tv({
  variants: {
    view: {
      [ProjectView.GRID]: "grid gap-5 sm:grid-cols-2 xl:grid-cols-3",
      [ProjectView.LIST]: "flex flex-col gap-2",
    },
  },
})

interface ProjectsContentProps {
  projects: Project[]
  view: ProjectView
  search: string
  isFiltered: boolean
  isLoading: boolean
  isError: boolean
  onCreate: () => void
  onClearFilters: () => void
}

/** Corpo da lista: erro, carregando, vazio ou as obras — um estado por vez. */
export function ProjectsContent({
  projects,
  view,
  search,
  isFiltered,
  isLoading,
  isError,
  onCreate,
  onClearFilters,
}: ProjectsContentProps) {
  const { t } = useTranslation()

  if (isError) return <EmptyState title={t("projects.errorTitle")} body={t("projects.errorHint")} />
  if (isLoading) return <ProjectsLoading />

  if (projects.length === 0) {
    // Com filtro, a ação é limpar o filtro; sem obra nenhuma, criar a primeira.
    return (
      <EmptyState
        title={search ? t("projects.emptySearchTitle", { term: search }) : t("projects.emptyTitle")}
        body={isFiltered ? t("projects.emptyFilteredHint") : t("projects.emptyHint")}
        action={
          isFiltered ? (
            <Button variant="ghost" fullWidth={false} onClick={onClearFilters}>
              {t("projects.clearFilters")}
            </Button>
          ) : (
            <Button fullWidth={false} onClick={onCreate}>
              <Plus size={16} />
              {t("projects.newProject")}
            </Button>
          )
        }
      />
    )
  }

  const isGrid = view === ProjectView.GRID

  return (
    <motion.div layout className={layout({ view })}>
      <AnimatePresence mode="popLayout">
        {projects.map((project, index) => (
          <motion.div
            key={`${project.id}-${view}`}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: index * STAGGER }}
          >
            {isGrid ? <ProjectCard project={project} /> : <ProjectRow project={project} />}
          </motion.div>
        ))}
        {isGrid && !isFiltered && (
          <motion.div key="new" layout>
            <NewProjectCard onCreate={onCreate} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
