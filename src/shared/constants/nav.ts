import {
  BarChart3,
  Building,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Home,
  LayoutGrid,
  ListOrdered,
  ListTodo,
  Notebook,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { AppModule, ObraModule, WorkspaceModule } from "./access"

/**
 * Itens de navegação dos dois níveis.
 *
 * A sidebar é a interseção desta lista com a matriz de acesso: a lista diz o
 * que **existe**, a matriz diz o que o papel **alcança**. Módulo sem página
 * não entra aqui — item de menu que não abre é pior que ausência de item.
 *
 * `badge` marca o item com contador ou alerta, como no protótipo (Tarefas com
 * a contagem, Orçamento com "!" quando há estouro). Fica estático até os
 * módulos passarem a informar os próprios números.
 */

export interface NavItem<M extends AppModule = AppModule> {
  module: M
  /** Caminho absoluto no nível 1; relativo à obra no nível 2. */
  path: string
  icon: LucideIcon
  /** Chave i18n do rótulo. */
  labelKey: string
}

export const WORKSPACE_NAV: NavItem<WorkspaceModule>[] = [
  { module: "home", path: "/dashboard", icon: Home, labelKey: "sidebar.nav.home" },
  { module: "obras", path: "/obras", icon: Building2, labelKey: "sidebar.nav.obras" },
  // Equipe da CONSTRUTORA (workspace_members) — a matriz esconde de quem não gerencia a conta.
  { module: "pessoas", path: "/pessoas", icon: UserCog, labelKey: "sidebar.nav.pessoas" },
]

export const OBRA_NAV: NavItem<ObraModule>[] = [
  { module: "visao-geral", path: "visao-geral", icon: Building, labelKey: "sidebar.nav.visaoGeral" },
  { module: "indicadores", path: "indicadores", icon: LayoutGrid, labelKey: "sidebar.nav.indicadores" },
  { module: "etapas", path: "etapas", icon: ListOrdered, labelKey: "sidebar.nav.etapas" },
  { module: "tarefas", path: "tarefas", icon: ListTodo, labelKey: "sidebar.nav.tarefas" },
  { module: "equipes", path: "equipes", icon: Users, labelKey: "sidebar.nav.equipes" },
  { module: "orcamento", path: "orcamento", icon: CreditCard, labelKey: "sidebar.nav.orcamento" },
  { module: "diario", path: "diario", icon: Notebook, labelKey: "sidebar.nav.diario" },
  { module: "documentos", path: "documentos", icon: FileText, labelKey: "sidebar.nav.documentos" },
  { module: "propostas", path: "propostas", icon: Sparkles, labelKey: "sidebar.nav.propostas" },
]

/**
 * Módulos de workspace que o design especifica e que ainda não têm página nem
 * backend — ficam registrados aqui para não se perderem do roadmap.
 */
export const DEFERRED_WORKSPACE_NAV: NavItem<WorkspaceModule>[] = [
  { module: "agenda", path: "/agenda", icon: CalendarDays, labelKey: "sidebar.nav.agenda" },
  { module: "relatorios", path: "/relatorios", icon: BarChart3, labelKey: "sidebar.nav.relatorios" },
]
