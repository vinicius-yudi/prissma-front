import { FolderOpen, Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { Num } from "@/shared/components/ui/num/Num"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"

import { ProjectCard } from "./components/ProjectCard"
import { ProjectStepModal } from "./components/ProjectStepModal"
import { ProjectsFilter } from "./components/ProjectsFilter"
import { useProjects } from "./hooks/useProjects"

/**
 * Obras (nível 1).
 *
 * O design divide a lista em "Minhas obras" e "Compartilhadas comigo", o que
 * exige saber o papel do usuário em cada obra. `GET /projects` ainda não
 * devolve `isOwner`/`myRole`, e descobrir isso hoje custaria uma consulta de
 * membros por obra na listagem. Até o backend expor esses campos, a lista vem
 * num grupo único — com o separador em caps e a contagem que o design pede.
 */

function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface-container-low" />
      ))}
    </div>
  )
}

function ErrorState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-24">
      <p className="font-medium text-on-surface">{t("projects.errorTitle")}</p>
      <p className="text-sm text-on-surface-variant">{t("projects.errorHint")}</p>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-outline bg-surface-container-low py-20">
      <div className="rounded-2xl border border-outline-variant bg-surface-container-high p-5">
        <FolderOpen size={34} strokeWidth={1.6} className="text-gold-bright" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-on-surface">{t("projects.emptyTitle")}</p>
        <p className="mt-1 text-sm text-on-surface-variant">{t("projects.emptyHint")}</p>
      </div>
      <Button variant="primary" fullWidth={false} onClick={onCreate}>
        <Plus size={15} />
        {t("projects.newProject")}
      </Button>
    </div>
  )
}

/** Separador de grupo: rótulo em caps, contagem em mono e régua até a borda. */
function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-on-surface-faint">
        {label}
      </span>
      <Num className="text-[10.5px] font-bold text-on-surface-variant">{count}</Num>
      <span className="h-px flex-1 bg-outline-variant" />
    </div>
  )
}

export function ProjetosPage() {
  const { projects, isLoading, isError, filter, setFilter, stats } = useProjects()
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)

  // Antes do early return: é o que alimenta o FAB da barra de abas no celular.
  usePrimaryAction({ label: t("projects.newProject"), onClick: () => setCreateOpen(true) })

  if (isError) return <ErrorState />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-[28px]">
            {t("projects.title")}
          </h1>
          <DimensionLine>
            {t("projects.dimension", { total: stats.total, inProgress: stats.inProgress })}
          </DimensionLine>
        </div>

        <Button
          variant="primary"
          fullWidth={false}
          onClick={() => setCreateOpen(true)}
          // No celular quem cria é o FAB da barra de abas.
          className="hidden lg:inline-flex"
        >
          <Plus size={15} />
          {t("projects.newProject")}
        </Button>
      </div>

      <ProjectsFilter filter={filter} onFilter={setFilter} stats={stats} />

      {isLoading ? (
        <LoadingState />
      ) : projects.length === 0 ? (
        <EmptyState onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-4">
          <GroupHeader label={t("projects.groupAll")} count={projects.length} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      <ProjectStepModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
