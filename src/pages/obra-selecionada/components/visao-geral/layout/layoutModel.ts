/**
 * Modelo do layout customizável da Visão Geral — só funções puras.
 *
 * O layout é uma lista ORDENADA de widgets (não posições x/y): o grid de 12
 * colunas com `grid-auto-flow: dense` encaixa os estreitos nos buracos. É o
 * que o servidor guarda em `obra.visao-geral.layout`.
 */

export type WidgetSize = "wide" | "narrow"

export interface WidgetPlacement {
  id: string
  visible: boolean
  size: WidgetSize
}

export interface OverviewLayout {
  version: 1
  widgets: WidgetPlacement[]
}

/** O mínimo do catálogo que o modelo precisa conhecer. */
export interface WidgetDefaults {
  id: string
  defaultSize: WidgetSize
  defaultVisible: boolean
}

export const LAYOUT_VERSION = 1

const SIZES: readonly WidgetSize[] = ["wide", "narrow"]

/** Layout de quem nunca personalizou: a ordem do catálogo, com os padrões dele. */
export function defaultLayout(catalog: readonly WidgetDefaults[]): OverviewLayout {
  return {
    version: LAYOUT_VERSION,
    widgets: catalog.map((w) => ({ id: w.id, visible: w.defaultVisible, size: w.defaultSize })),
  }
}

/**
 * Concilia um layout salvo com o catálogo atual — nunca quebra a tela:
 *
 * - ids que o catálogo não conhece mais (widget removido) são descartados;
 * - ids repetidos ficam só na primeira posição;
 * - `size` ou `visible` inválidos voltam ao padrão do widget;
 * - widgets novos, que o layout salvo ainda não conhece, entram no fim com o
 *   padrão deles (um widget novo oculto por padrão não aparece do nada).
 *
 * Qualquer coisa que não seja um layout reconhecível vira o padrão.
 */
export function normalize(saved: unknown, catalog: readonly WidgetDefaults[]): OverviewLayout {
  if (!isLayoutLike(saved)) return defaultLayout(catalog)

  const byId = new Map(catalog.map((w) => [w.id, w]))
  const seen = new Set<string>()
  const widgets: WidgetPlacement[] = []

  for (const raw of saved.widgets) {
    if (!raw || typeof raw !== "object") continue
    const { id, visible, size } = raw as Partial<WidgetPlacement>
    if (typeof id !== "string" || seen.has(id)) continue
    const known = byId.get(id)
    if (!known) continue
    seen.add(id)
    widgets.push({
      id,
      visible: typeof visible === "boolean" ? visible : known.defaultVisible,
      size: SIZES.includes(size as WidgetSize) ? (size as WidgetSize) : known.defaultSize,
    })
  }

  for (const w of catalog) {
    if (!seen.has(w.id)) widgets.push({ id: w.id, visible: w.defaultVisible, size: w.defaultSize })
  }

  return { version: LAYOUT_VERSION, widgets }
}

function isLayoutLike(value: unknown): value is { widgets: unknown[] } {
  return (
    !!value &&
    typeof value === "object" &&
    (value as { version?: unknown }).version === LAYOUT_VERSION &&
    Array.isArray((value as { widgets?: unknown }).widgets)
  )
}

/** Move `activeId` para a posição de `overId` (mesma semântica do arrayMove do dnd-kit). */
export function move(layout: OverviewLayout, activeId: string, overId: string): OverviewLayout {
  const from = layout.widgets.findIndex((w) => w.id === activeId)
  const to = layout.widgets.findIndex((w) => w.id === overId)
  if (from < 0 || to < 0 || from === to) return layout
  const widgets = [...layout.widgets]
  const [item] = widgets.splice(from, 1)
  widgets.splice(to, 0, item)
  return { ...layout, widgets }
}

/** Coloca `id` logo depois de `afterId` — soltar na área vazia do fim de uma coluna. */
export function moveAfter(layout: OverviewLayout, id: string, afterId: string): OverviewLayout {
  const item = layout.widgets.find((w) => w.id === id)
  const widgets = layout.widgets.filter((w) => w.id !== id)
  const index = widgets.findIndex((w) => w.id === afterId)
  if (!item || index < 0 || id === afterId) return layout
  widgets.splice(index + 1, 0, item)
  return { ...layout, widgets }
}

/**
 * Sobe (-1) ou desce (+1) um widget entre os que estão NA TELA — os ocultos
 * ou sem acesso no meio da lista não contam como posição. É o caminho dos
 * botões ↑↓ (teclado e celular).
 */
export function step(layout: OverviewLayout, id: string, direction: -1 | 1, isShown: (id: string) => boolean): OverviewLayout {
  const shown = layout.widgets.filter((w) => isShown(w.id)).map((w) => w.id)
  const index = shown.indexOf(id)
  const target = shown[index + direction]
  if (index < 0 || target === undefined) return layout
  return move(layout, id, target)
}

export function hide(layout: OverviewLayout, id: string): OverviewLayout {
  return update(layout, id, (w) => ({ ...w, visible: false }))
}

/** Mostrar de novo coloca o widget no fim — onde a pessoa vai procurar o que acabou de adicionar. */
export function show(layout: OverviewLayout, id: string): OverviewLayout {
  const item = layout.widgets.find((w) => w.id === id)
  if (!item) return layout
  const rest = layout.widgets.filter((w) => w.id !== id)
  return { ...layout, widgets: [...rest, { ...item, visible: true }] }
}

export function toggleSize(layout: OverviewLayout, id: string): OverviewLayout {
  return update(layout, id, (w) => ({ ...w, size: w.size === "wide" ? "narrow" : "wide" }))
}

/**
 * O que renderizar para o perfil atual. Um widget sem acesso continua no
 * layout salvo (volta no lugar certo numa obra onde o papel permite), só não
 * aparece.
 */
export function visibleFor(layout: OverviewLayout, canSee: (id: string) => boolean): WidgetPlacement[] {
  return layout.widgets.filter((w) => w.visible && canSee(w.id))
}

/** Ocultos que o perfil pode adicionar — o conteúdo da gaveta. */
export function hiddenFor(layout: OverviewLayout, canSee: (id: string) => boolean): WidgetPlacement[] {
  return layout.widgets.filter((w) => !w.visible && canSee(w.id))
}

export function sameLayout(a: OverviewLayout, b: OverviewLayout): boolean {
  return (
    a.widgets.length === b.widgets.length &&
    a.widgets.every((w, i) => {
      const other = b.widgets[i]
      return other.id === w.id && other.visible === w.visible && other.size === w.size
    })
  )
}

function update(layout: OverviewLayout, id: string, fn: (w: WidgetPlacement) => WidgetPlacement): OverviewLayout {
  return { ...layout, widgets: layout.widgets.map((w) => (w.id === id ? fn(w) : w)) }
}
