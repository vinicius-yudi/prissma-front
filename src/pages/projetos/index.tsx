import { FolderOpen, Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { Num } from "@/shared/components/ui/num/Num"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"

import { ProjectCard } from "./components/ProjectCard"
import { ProjectStepModal } from "./components/ProjectStepModal"
import { ProjectsFilter } from "./components/ProjectsFilter"
import { useProjects } from "./hooks/useProjects"

/** Parâmetro que abre o cadastro de obra direto: `/obras?nova=1`. */
const NEW_PARAM = "nova"

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
        <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  )
}

function ErrorState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-24">
      <p className="font-medium text-ink">{t("projects.errorTitle")}</p>
      <p className="text-sm text-ink-2">{t("projects.errorHint")}</p>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border-strong bg-surface py-20">
      <div className="rounded-2xl border border-border bg-raised p-5">
        <FolderOpen size={34} strokeWidth={1.6} className="text-gold-hi" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-ink">{t("projects.emptyTitle")}</p>
        <p className="mt-1 text-sm text-ink-2">{t("projects.emptyHint")}</p>
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
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        {label}
      </span>
      <Num className="text-[10.5px] font-bold text-ink-2">{count}</Num>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function ProjetosPage() {
  const { projects, isLoading, isError, filter, setFilter, stats } = useProjects()
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  // Sidebar, barra superior e busca ⌘K abrem o cadastro por `?nova=1`: o
  // atalho funciona de qualquer tela sem o shell conhecer este modal.
  const [searchParams, setSearchParams] = useSearchParams()
  const isCreateOpen = createOpen || searchParams.get(NEW_PARAM) === "1"

  function closeCreate() {
    setCreateOpen(false)
    if (!searchParams.has(NEW_PARAM)) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(NEW_PARAM)
        return next
      },
      { replace: true },
    )
  }

  // Antes do early return: é o que alimenta o FAB da barra de abas no celular.
  usePrimaryAction({ label: t("projects.newProject"), onClick: () => setCreateOpen(true) })

  if (isError) return <ErrorState />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
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

      <ProjectStepModal open={isCreateOpen} onClose={closeCreate} />
    </div>
  )
}
