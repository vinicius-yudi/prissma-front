/**
 * Geometria da fachada em prancha (viewBox 240×160).
 *
 * O desenho é gerado, não uma imagem: pavimentos definem a altura, o tipo de
 * telhado muda o topo e a semente varia as janelas — sempre igual para a mesma
 * obra, porque a semente vem do id dela.
 */

export type FachadaRoof = "gable" | "flat"

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface FachadaGeometry {
  x0: number
  width: number
  ground: number
  floorHeight: number
  bodyHeight: number
  top: number
  roofPath: string
  roofHeight: number
  totalTop: number
  windows: Rect[]
  door: Rect
}

export const VIEW_W = 240
export const VIEW_H = 160

/** Gerador pseudoaleatório determinístico (LCG): mesma semente, mesmo desenho. */
function seeded(seed: number): () => number {
  let s = (Math.abs(Math.trunc(seed)) * 9301 + 49297) % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

interface GeometryInput {
  floors: number
  roof: FachadaRoof
  seed: number
  showDims: boolean
}

function buildWindows(input: {
  floors: number
  cols: number
  x0: number
  colWidth: number
  ground: number
  floorHeight: number
  flat: boolean
  rand: () => number
}): Rect[] {
  const { floors, cols, x0, colWidth, ground, floorHeight, flat, rand } = input
  const windows: Rect[] = []
  const doorCol = Math.floor(cols / 2)

  for (let floor = 0; floor < floors; floor++) {
    const y = ground - (floor + 1) * floorHeight
    for (let col = 0; col < cols; col++) {
      if (floor === 0 && col === doorCol) continue
      // Térreo comercial tem vitrine larga; o resto, janela comum.
      const storefront = flat && floor === 0
      const w = storefront ? colWidth * 0.78 : colWidth * (0.42 + rand() * 0.12)
      const h = storefront ? floorHeight * 0.62 : floorHeight * 0.42
      windows.push({
        x: x0 + col * colWidth + (colWidth - w) / 2,
        y: y + (storefront ? floorHeight * 0.2 : floorHeight * 0.26),
        w,
        h,
      })
    }
  }
  return windows
}

export function fachadaGeometry({ floors, roof, seed, showDims }: GeometryInput): FachadaGeometry {
  const rand = seeded(seed)
  const flat = roof === "flat"
  const width = flat ? 150 : 124
  const x0 = (VIEW_W - width) / 2 + (showDims ? 8 : 0)
  const ground = 142
  const floorHeight = Math.min(30, 92 / floors)
  const bodyHeight = floorHeight * floors
  const roofHeight = flat ? 7 : Math.min(34, width * 0.26)
  const top = ground - bodyHeight
  const cols = flat ? 5 : 3 + Math.floor(rand() * 2)
  const colWidth = width / cols

  const windows = buildWindows({ floors, cols, x0, colWidth, ground, floorHeight, flat, rand })

  const doorWidth = colWidth * 0.44
  const door = {
    x: x0 + Math.floor(cols / 2) * colWidth + (colWidth - doorWidth) / 2,
    y: ground - floorHeight * 0.78,
    w: doorWidth,
    h: floorHeight * 0.78,
  }

  const roofPath = flat
    ? `M${x0 - 3} ${top} L${x0 - 3} ${top - roofHeight} L${x0 + width + 3} ${top - roofHeight} L${x0 + width + 3} ${top}`
    : `M${x0 - 8} ${top} L${x0 + width / 2} ${top - roofHeight} L${x0 + width + 8} ${top}`

  return {
    x0,
    width,
    ground,
    floorHeight,
    bodyHeight,
    top,
    roofPath,
    roofHeight,
    totalTop: top - roofHeight,
    windows,
    door,
  }
}

/**
 * Pavimentos estimados pela relação área construída / terreno, de 1 a 4. O
 * backend não guarda pavimentos; a razão dá um desenho coerente com a obra.
 */
export function estimateFloors(builtArea: number, landArea: number): number {
  if (!builtArea || !landArea) return 1
  return Math.max(1, Math.min(4, Math.ceil(builtArea / landArea)))
}

/** Tipo de projeto do backend → telhado: residencial em duas águas, o resto em platibanda. */
export function roofFor(projectType: string | null | undefined): FachadaRoof {
  return projectType === "RESIDENTIAL" ? "gable" : "flat"
}
