import { screen } from "@testing-library/react"
import { Outlet, Route, Routes } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

import { ProjectStatus, type Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import {
  DiarioModule,
  DocumentosModule,
  EquipesModule,
  EtapasModule,
  IndicadoresModule,
  OrcamentoModule,
  PropostasModule,
  TarefasModule,
  VisaoGeralModule,
} from "../modules"

/**
 * Cada módulo é só o adaptador entre o Outlet do <ObraLayout> e o componente
 * de aba: a obra já vem carregada, e nenhum deles refaz o fetch. O que os
 * testes guardam é justamente esse repasse — as abas têm testes próprios, e
 * aqui elas entram mockadas para não arrastar a rede junto.
 */
vi.mock("../components/visaoGeral", () => ({
  VisaoGeral: ({ project }: { project: Project }) => <span>visao-geral-{project.id}</span>,
}))
vi.mock("../components/EtapasTab", () => ({
  EtapasTab: ({ projectId, projectStartDate }: { projectId: number; projectStartDate: string | null }) => (
    <span>etapas-{projectId}-{projectStartDate}</span>
  ),
}))
vi.mock("../components/TarefasTab", () => ({
  TarefasTab: ({ projectId }: { projectId: number }) => <span>tarefas-{projectId}</span>,
}))
vi.mock("../components/EquipesTab", () => ({
  EquipesTab: ({ obraId }: { obraId: number }) => <span>equipes-{obraId}</span>,
}))
vi.mock("../components/OrcamentoTab", () => ({
  OrcamentoTab: ({ projectId }: { projectId: number }) => <span>orcamento-{projectId}</span>,
}))
vi.mock("../components/DocumentosTab", () => ({
  DocumentosTab: ({ projectId }: { projectId: number }) => <span>documentos-{projectId}</span>,
}))
vi.mock("../components/DiarioDaObra", () => ({
  default: ({ projectId }: { projectId: number }) => <span>diario-{projectId}</span>,
}))

const OBRA: Project = {
  id: 7,
  title: "Residencial Alfa",
  address: "Rua das Palmeiras, 100",
  street: null,
  number: null,
  complement: null,
  neighborhood: null,
  city: null,
  state: null,
  zipCode: null,
  projectType: "RESIDENTIAL",
  category: "BUILDING",
  landArea: 400,
  builtArea: 250,
  status: ProjectStatus.IN_PROGRESS,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-12-01",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}

/** Monta o módulo sob um Outlet que entrega a obra, como faz o ObraLayout. */
function renderModule(Modulo: () => React.ReactElement) {
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<OutletHost />}>
        <Route index element={<Modulo />} />
      </Route>
    </Routes>,
  )
}

function OutletHost() {
  return <Outlet context={OBRA satisfies Project} />
}

describe("módulos da obra", () => {
  it.each([
    [VisaoGeralModule, "visao-geral-7"],
    [TarefasModule, "tarefas-7"],
    [EquipesModule, "equipes-7"],
    [OrcamentoModule, "orcamento-7"],
    [DocumentosModule, "documentos-7"],
    [DiarioModule, "diario-7"],
  ])("repassa a obra do Outlet para a aba (%#)", (Modulo, marcador) => {
    renderModule(Modulo)

    expect(screen.getByText(marcador)).toBeInTheDocument()
  })

  // Etapas precisa também do início da obra: é contra ele que o formulário
  // valida a data da primeira etapa.
  it("entrega a data de início da obra às etapas", () => {
    renderModule(EtapasModule)

    expect(screen.getByText("etapas-7-2026-03-01")).toBeInTheDocument()
  })
})

/**
 * Melhor uma tela honesta que um item de menu que não abre: Indicadores e
 * Propostas estão no design e ainda não têm backend.
 */
describe("módulos ainda sem backend", () => {
  it.each([
    [IndicadoresModule, "Indicadores"],
    [PropostasModule, "Propostas"],
  ])("anuncia %# como em breve", (Modulo, titulo) => {
    renderModule(Modulo)

    expect(screen.getByText(titulo)).toBeInTheDocument()
    expect(screen.getByText(/em breve|Em breve/)).toBeInTheDocument()
  })
})
