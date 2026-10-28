import { describe, expect, it } from "vitest"

import {
  defaultLayout,
  hiddenFor,
  hide,
  move,
  moveAfter,
  normalize,
  sameLayout,
  show,
  step,
  toggleSize,
  visibleFor,
  type OverviewLayout,
  type WidgetDefaults,
} from "../layoutModel"

const CATALOG: WidgetDefaults[] = [
  { id: "a", defaultSize: "wide", defaultVisible: true },
  { id: "b", defaultSize: "narrow", defaultVisible: true },
  { id: "c", defaultSize: "wide", defaultVisible: true },
  { id: "novo", defaultSize: "narrow", defaultVisible: false },
]

const ids = (layout: OverviewLayout) => layout.widgets.map((w) => w.id)

describe("defaultLayout", () => {
  it("segue a ordem e os padrões do catálogo", () => {
    expect(defaultLayout(CATALOG)).toEqual({
      version: 1,
      widgets: [
        { id: "a", visible: true, size: "wide" },
        { id: "b", visible: true, size: "narrow" },
        { id: "c", visible: true, size: "wide" },
        { id: "novo", visible: false, size: "narrow" },
      ],
    })
  })
})

describe("normalize", () => {
  it.each([null, undefined, "x", 42, {}, { version: 2, widgets: [] }, { version: 1, widgets: "nope" }])(
    "cai no padrão com valor irreconhecível (%s)",
    (saved) => {
      expect(normalize(saved, CATALOG)).toEqual(defaultLayout(CATALOG))
    },
  )

  it("mantém a ordem salva e acrescenta no fim o widget que o layout não conhecia, com o padrão dele", () => {
    const saved = {
      version: 1,
      widgets: [
        { id: "c", visible: true, size: "narrow" },
        { id: "a", visible: false, size: "wide" },
        { id: "b", visible: true, size: "narrow" },
      ],
    }

    const layout = normalize(saved, CATALOG)

    expect(ids(layout)).toEqual(["c", "a", "b", "novo"])
    expect(layout.widgets[0]).toEqual({ id: "c", visible: true, size: "narrow" })
    expect(layout.widgets[1].visible).toBe(false)
    expect(layout.widgets[3]).toEqual({ id: "novo", visible: false, size: "narrow" })
  })

  it("descarta id que saiu do catálogo, repetido ou malformado, e corrige campos inválidos", () => {
    const saved = {
      version: 1,
      widgets: [
        { id: "removido", visible: true, size: "wide" },
        { id: "b", visible: "sim", size: "gigante" },
        { id: "b", visible: false, size: "wide" },
        "lixo",
        null,
        { visible: true },
      ],
    }

    const layout = normalize(saved, CATALOG)

    expect(ids(layout)).toEqual(["b", "a", "c", "novo"])
    expect(layout.widgets[0]).toEqual({ id: "b", visible: true, size: "narrow" })
  })
})

describe("operações", () => {
  const base = defaultLayout(CATALOG)

  it("move para a posição do alvo, nos dois sentidos", () => {
    expect(ids(move(base, "a", "c"))).toEqual(["b", "c", "a", "novo"])
    expect(ids(move(base, "c", "a"))).toEqual(["c", "a", "b", "novo"])
    expect(move(base, "a", "a")).toBe(base)
    expect(move(base, "a", "inexistente")).toBe(base)
  })

  it("moveAfter coloca logo depois do alvo", () => {
    expect(ids(moveAfter(base, "a", "c"))).toEqual(["b", "c", "a", "novo"])
    expect(ids(moveAfter(base, "novo", "a"))).toEqual(["a", "novo", "b", "c"])
    expect(moveAfter(base, "a", "a")).toBe(base)
  })

  it("step sobe e desce só entre os que estão na tela", () => {
    const wideOnly = (id: string) => base.widgets.some((w) => w.id === id && w.visible && w.size === "wide")

    // "b" (estreito) fica no meio da lista mas não conta como posição.
    expect(ids(step(base, "c", -1, wideOnly))).toEqual(["c", "a", "b", "novo"])
    expect(ids(step(base, "a", 1, wideOnly))).toEqual(["b", "c", "a", "novo"])
    expect(step(base, "a", -1, wideOnly)).toBe(base)
    expect(step(base, "c", 1, wideOnly)).toBe(base)
  })

  it("hide oculta sem tirar do lugar; show traz de volta no fim", () => {
    const hidden = hide(base, "a")
    expect(ids(hidden)).toEqual(ids(base))
    expect(hidden.widgets[0].visible).toBe(false)

    const shown = show(hidden, "a")
    expect(ids(shown)).toEqual(["b", "c", "novo", "a"])
    expect(shown.widgets[3].visible).toBe(true)
  })

  it("toggleSize alterna entre as colunas", () => {
    expect(toggleSize(base, "a").widgets[0].size).toBe("narrow")
    expect(toggleSize(toggleSize(base, "a"), "a").widgets[0].size).toBe("wide")
  })

  it("não altera o layout original", () => {
    const snapshot = structuredClone(base)
    move(base, "a", "c")
    hide(base, "b")
    show(base, "novo")
    toggleSize(base, "c")
    expect(base).toEqual(snapshot)
  })
})

describe("acesso", () => {
  const layout = defaultLayout(CATALOG)
  const semB = (id: string) => id !== "b"

  it("visibleFor esconde o widget sem acesso, mas ele continua no layout", () => {
    expect(visibleFor(layout, semB).map((w) => w.id)).toEqual(["a", "c"])
    expect(ids(layout)).toContain("b")
  })

  it("hiddenFor só oferece o que o perfil pode ver", () => {
    expect(hiddenFor(hide(layout, "b"), semB).map((w) => w.id)).toEqual(["novo"])
    expect(hiddenFor(hide(layout, "b"), () => true).map((w) => w.id)).toEqual(["b", "novo"])
  })
})

describe("sameLayout", () => {
  it("compara ordem, visibilidade e tamanho", () => {
    const base = defaultLayout(CATALOG)
    expect(sameLayout(base, structuredClone(base))).toBe(true)
    expect(sameLayout(base, move(base, "a", "b"))).toBe(false)
    expect(sameLayout(base, hide(base, "a"))).toBe(false)
    expect(sameLayout(base, toggleSize(base, "a"))).toBe(false)
  })
})
