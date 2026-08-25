import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate, useParams } from "react-router-dom"

import { DeleteProjectModal } from "@/pages/projetos/components/DeleteProjectModal"
import { ProjectStepModal } from "@/pages/projetos/components/ProjectStepModal"
import { Button } from "@/shared/components/ui/button/Button"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatProjectAddress, type Project } from "@/shared/types/project"
import { formatDate, formatObraCode } from "@/shared/utils/formatters"

import { useObraSelecionada } from "./hooks/useObraSelecionada"

/**
 * Contexto de obra (nível 2).
 *
 * Carrega a obra uma vez e a entrega aos módulos filhos pelo Outlet — antes
 * cada aba vivia dentro de um `useState` local, e o módulo aberto não existia
 * na URL. A navegação canônica passou a ser a sidebar (Fluxos v2 §1), então a
 * barra de abas que existia aqui saiu.
 */

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-1/3 rounded-xl bg-surface-container-low" />
      <div className="h-4 w-1/4 rounded bg-surface-container-low" />
      <div className="mt-4 h-64 rounded-xl bg-surface-container-low" />
    </div>
  )
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <h2 className="text-xl font-semibold text-on-surface">{t("obra.notFound")}</h2>
      <p className="text-on-surface-variant">{t("obra.notFoundDesc")}</p>
      <Button variant="outline" fullWidth={false} onClick={onBack}>
        {t("obra.backToList")}
      </Button>
    </div>
  )
}

export function ObraLayout() {
  const { obraId } = useParams<{ obraId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const id = Number(obraId)
  const { projectQuery } = useObraSelecionada(id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleBack() {
    navigate("/obras")
  }

  if (!id) return <NotFoundState onBack={handleBack} />
  if (projectQuery.isLoading) return <LoadingState />
  if (projectQuery.isError) return <NotFoundState onBack={handleBack} />
  if (!projectQuery.data) return null

  const project = projectQuery.data

  return (
    <div>
      <header className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-[28px]">
              {project.title}
            </h1>
            <StatusBadge status={project.status} plannedEndDate={project.plannedEndDate} />
          </div>

          {/* A cota É o subtítulo da página — não acompanha outra linha de
              apoio, senão o H1 ganha dois subtítulos e a assinatura se perde. */}
          <DimensionLine>
            {[
              formatObraCode(project.id),
              formatProjectAddress(project),
              project.plannedStartDate &&
                t("obra.startedAt", { date: formatDate(project.plannedStartDate) }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </DimensionLine>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="destructive" fullWidth={false} onClick={() => setDeleteOpen(true)}>
            {t("obra.delete")}
          </Button>
          <Button variant="primary" fullWidth={false} onClick={() => setEditOpen(true)}>
            {t("obra.edit")}
          </Button>
        </div>
      </header>

      <main>
        <Outlet context={project satisfies Project} />
      </main>

      <ProjectStepModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <DeleteProjectModal
        project={deleteOpen ? project : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate("/obras")}
      />
    </div>
  )
}
