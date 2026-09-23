import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Outlet, useMatch, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { DimensionLine } from "@/shared/components/ui/dimension-line/DimensionLine"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatProjectAddress, type Project } from "@/shared/types/project"
import { formatDate, formatObraCode } from "@/shared/utils/formatters"

import { ObraModuleRail } from "./components/ObraModuleRail"
import { useObraSelecionada } from "./hooks/useObraSelecionada"

/**
 * Contexto de obra (nível 2).
 *
 * Carrega a obra uma vez e a entrega aos módulos filhos pelo Outlet — antes
 * cada aba vivia dentro de um `useState` local, e o módulo aberto não existia
 * na URL. A navegação canônica é a sidebar no desktop (Fluxos v2 §1) e, no
 * celular, o par breadcrumb + <ObraModuleRail> daqui.
 *
 * Editar e excluir a obra ficam na Visão geral, não neste cabeçalho: aqui elas
 * se repetiriam em todos os módulos.
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
  const isVisaoGeral = useMatch("/obras/:obraId/visao-geral") !== null

  function handleBack() {
    navigate("/obras")
  }

  if (!id) return <NotFoundState onBack={handleBack} />
  if (projectQuery.isLoading) return <LoadingState />
  if (projectQuery.isError) return <NotFoundState onBack={handleBack} />
  if (!projectQuery.data) return null

  const project = projectQuery.data

  // Na Visão geral o passo atrás é sair da obra; nos módulos, voltar para ela.
  // No desktop quem faz esse papel é o cartão de contexto da sidebar.
  const backLabel = isVisaoGeral ? t("sidebar.nav.obras") : project.title
  const backTo = isVisaoGeral ? "/obras" : `/obras/${id}/visao-geral`

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => navigate(backTo)}
          aria-label={t("mobile.backTo", { target: backLabel })}
          className="flex min-h-11 cursor-pointer items-center gap-1 self-start text-[12.5px] font-semibold text-gold-bright"
        >
          <ChevronLeft size={14} />
          <span className="max-w-[70vw] truncate">{backLabel}</span>
        </button>

        <ObraModuleRail obraId={id} />
      </div>

      <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between lg:pb-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-[28px]">
              {project.title}
            </h1>
            <StatusBadge status={project.status} plannedEndDate={project.plannedEndDate} />
          </div>

          {/* A legenda técnica É o subtítulo da página — não acompanha outra
              linha de apoio, senão o H1 ganha dois subtítulos. */}
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
      </header>

      <main>
        <Outlet context={project satisfies Project} />
      </main>
    </div>
  )
}
