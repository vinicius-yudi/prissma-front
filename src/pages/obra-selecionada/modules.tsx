import { useOutletContext } from "react-router-dom"

import type { Project } from "@/shared/types/project"

import { ComingSoon } from "./components/ComingSoon"
import { DocumentosTab } from "./components/DocumentosTab"
import DiarioDaObra from "./components/DiarioDaObra"
import { EquipesTab } from "./components/EquipesTab"
import { EtapasTab } from "./components/EtapasTab"
import { OrcamentoTab } from "./components/OrcamentoTab"
import { PropostasTab } from "./components/PropostasTab"
import { ScheduleTab } from "./components/ScheduleTab"
import { TarefasTab } from "./components/TarefasTab"
import { VisaoGeral } from "./components/visao-geral/VisaoGeral"

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

export function ScheduleModule() {
  return <ScheduleTab projectId={useObra().id} />
}

export function OrcamentoModule() {
  return <OrcamentoTab project={useObra()} />
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
  return <PropostasTab projectId={useObra().id} />
}
