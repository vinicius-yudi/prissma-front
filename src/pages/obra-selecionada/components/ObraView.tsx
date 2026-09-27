import { ChevronLeft } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Outlet, useNavigate } from "react-router-dom"

import type { Project } from "@/shared/types/project"

import { useObraHeader } from "../hooks/useObraHeader"
import { ObraHeader } from "./obra-header/ObraHeader"
import { ObraTabs } from "./ObraTabs"

interface ObraViewProps {
  project: Project
  isVisaoGeral: boolean
}

/**
 * Obra carregada: passo atrás, cabeçalho (grande na Visão geral, compacto nos
 * módulos), abas fixas e o módulo aberto. Os números do cabeçalho alimentam
 * também as contagens e os alertas das abas.
 */
export function ObraView({ project, isVisaoGeral }: ObraViewProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const header = useObraHeader(project)

  // Na Visão geral o passo atrás é sair da obra; nos módulos, voltar para ela.
  const backLabel = isVisaoGeral ? t("sidebar.nav.obras") : project.title
  const backTo = isVisaoGeral ? "/obras" : `/obras/${project.id}/visao-geral`

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate(backTo)}
        aria-label={t("mobile.backTo", { target: backLabel })}
        className="group mb-4 flex min-h-9 cursor-pointer items-center gap-1 text-[13.5px] text-ink-3 transition-colors hover:text-ink"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        <span className="max-w-[70vw] truncate">{backLabel}</span>
      </button>

      <ObraHeader project={project} full={isVisaoGeral} data={header} />

      <div className="mt-6">
        <ObraTabs obraId={project.id} data={header} />
      </div>

      <Outlet context={project satisfies Project} />
    </div>
  )
}
