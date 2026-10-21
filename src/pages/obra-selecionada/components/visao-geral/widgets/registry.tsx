import type { ReactNode } from "react"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import type { ObraModule } from "@/shared/constants/access"
import type { ProjectBudget } from "@/shared/types/budget"
import { ProjectStatus, type Project } from "@/shared/types/project"

import { CurrentStageCard } from "../CurrentStageCard"
import type { WidgetDefaults } from "../layout/layoutModel"
import { OverviewAttention } from "../OverviewAttention"
import { OverviewBudget } from "../OverviewBudget"
import { OverviewDiary } from "../OverviewDiary"
import { OverviewTeam } from "../OverviewTeam"
import { MyTasksWidget } from "./MyTasksWidget"
import { DocumentsSection, ScheduleSection } from "./OverviewSections"
import { ProposalsWidget } from "./ProposalsWidget"
import { RecentExpensesWidget } from "./RecentExpensesWidget"
import { WeekScheduleWidget } from "./WeekScheduleWidget"

/** O que a Visão Geral já carregou e repassa aos widgets — ninguém busca de novo. */
export interface WidgetContext {
  project: Project
  stages: StageSummary[]
  currentStage: StageSummary | null
  budget: ProjectBudget | null
}

/**
 * Um widget do catálogo. Título e descrição vêm do i18n:
 * `obra.visaoGeral.widgets.<id>.title` e `.description`.
 */
export interface WidgetDefinition extends WidgetDefaults {
  /** Módulo cujo acesso libera o widget (matriz `access.ts`). */
  module: ObraModule
  /**
   * `null` quando o widget não tem o que mostrar agora (ex.: obra sem etapa
   * em andamento). Fora do modo edição ele simplesmente não ocupa espaço.
   *
   * Chamada como função comum, não como componente: NÃO pode usar hooks.
   * Widget que precisa de hook vira componente próprio (ScheduleSection).
   */
  render: (ctx: WidgetContext) => ReactNode | null
}

/**
 * Catálogo da Visão Geral. A ORDEM aqui é o layout padrão — os sete primeiros
 * reproduzem a tela de antes da customização; os novos começam ocultos.
 *
 * O `id` vai para o banco: renomear um id exige tratar o antigo no
 * `normalize()`, senão o widget some do layout de quem já salvou.
 */
export const WIDGETS: readonly WidgetDefinition[] = [
  {
    id: "attention",
    module: "visao-geral",
    defaultSize: "wide",
    defaultVisible: true,
    render: (ctx) => (
      <OverviewAttention projectId={ctx.project.id} stages={ctx.stages} budgetItems={ctx.budget?.items ?? []} />
    ),
  },
  {
    id: "budget",
    module: "orcamento",
    defaultSize: "narrow",
    defaultVisible: true,
    render: (ctx) => <OverviewBudget projectId={ctx.project.id} budget={ctx.budget} />,
  },
  {
    id: "schedule",
    module: "etapas",
    defaultSize: "wide",
    defaultVisible: true,
    render: (ctx) => <ScheduleSection projectId={ctx.project.id} stages={ctx.stages} />,
  },
  {
    id: "team",
    module: "equipes",
    defaultSize: "narrow",
    defaultVisible: true,
    render: (ctx) => <OverviewTeam projectId={ctx.project.id} />,
  },
  {
    id: "current-stage",
    module: "etapas",
    defaultSize: "wide",
    defaultVisible: true,
    render: (ctx) => {
      const stage = ctx.currentStage
      if (!stage || ctx.project.status === ProjectStatus.COMPLETED) return null
      return (
        <CurrentStageCard
          stage={stage}
          position={ctx.stages.findIndex((s) => s.id === stage.id) + 1}
          total={ctx.stages.length}
        />
      )
    },
  },
  {
    id: "diary",
    module: "diario",
    defaultSize: "narrow",
    defaultVisible: true,
    render: (ctx) => <OverviewDiary projectId={ctx.project.id} />,
  },
  {
    id: "documents",
    module: "documentos",
    defaultSize: "narrow",
    defaultVisible: true,
    render: (ctx) => <DocumentsSection projectId={ctx.project.id} />,
  },
  {
    id: "my-tasks",
    module: "tarefas",
    defaultSize: "narrow",
    defaultVisible: false,
    render: (ctx) => <MyTasksWidget projectId={ctx.project.id} />,
  },
  {
    id: "proposals",
    module: "propostas",
    defaultSize: "narrow",
    defaultVisible: false,
    render: (ctx) => <ProposalsWidget projectId={ctx.project.id} />,
  },
  {
    id: "week-schedule",
    module: "schedule",
    defaultSize: "wide",
    defaultVisible: false,
    render: (ctx) => <WeekScheduleWidget projectId={ctx.project.id} />,
  },
  {
    id: "recent-expenses",
    module: "orcamento",
    defaultSize: "narrow",
    defaultVisible: false,
    render: (ctx) => <RecentExpensesWidget projectId={ctx.project.id} budget={ctx.budget} />,
  },
]

export const WIDGETS_BY_ID: ReadonlyMap<string, WidgetDefinition> = new Map(WIDGETS.map((w) => [w.id, w]))
