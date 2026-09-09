import { useTranslation } from "react-i18next"
import { useOutletContext } from "react-router-dom"

import type { Project } from "@/shared/types/project"

import { DocumentosTab } from "./components/DocumentosTab"
import DiarioDaObra from "./components/DiarioDaObra"
import { EquipesTab } from "./components/EquipesTab"
import { EtapasTab } from "./components/EtapasTab"
import { OrcamentoTab } from "./components/OrcamentoTab"
import { TarefasTab } from "./components/TarefasTab"
import { VisaoGeral } from "./components/visaoGeral"

/**
 * Módulos do nível 2, cada um em sua própria rota.
 *
 * A obra vem do Outlet do <ObraLayout>, que já a carregou — nenhum módulo
 * refaz o fetch. Os componentes `*Tab` são os mesmos de antes; o que mudou é
 * que agora têm URL própria.
 */

function useObra(): Project {
  return useOutletContext<Project>()
}

/**
 * Placeholder dos módulos que o design especifica mas que ainda não têm
 * backend (Diário, Propostas) ou que ficaram para a fase seguinte
 * (Indicadores). Melhor uma tela honesta que um item de menu que não abre.
 */
function ComingSoon({ module }: { module: string }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline bg-surface-container-low py-20 text-center">
      <p className="text-sm font-semibold text-on-surface">{t(`sidebar.nav.${module}`)}</p>
      <p className="text-sm text-on-surface-variant">{t("obra.comingSoon")}</p>
    </div>
  )
}

export function VisaoGeralModule() {
  return <VisaoGeral project={useObra()} />
}

export function EtapasModule() {
  const project = useObra()
  return <EtapasTab projectId={project.id} projectStartDate={project.plannedStartDate} />
}

export function TarefasModule() {
  return <TarefasTab projectId={useObra().id} />
}

export function EquipesModule() {
  return <EquipesTab obraId={useObra().id} />
}

export function OrcamentoModule() {
  return <OrcamentoTab projectId={useObra().id} />
}

export function DocumentosModule() {
  return <DocumentosTab projectId={useObra().id} />
}

export function IndicadoresModule() {
  return <ComingSoon module="indicadores" />
}

export function DiarioModule() {
  return <DiarioDaObra projectId={useObra().id} />
}

export function PropostasModule() {
  return <ComingSoon module="propostas" />
}
