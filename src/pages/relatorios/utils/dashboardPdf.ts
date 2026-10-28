import type { jsPDF as JsPdf } from "jspdf"

import { todayIsoDate } from "@/shared/utils/formatters"

/** Marca, dentro da folha do dashboard, cada bloco que vai para o PDF. */
export const PDF_BLOCK_ATTR = "data-pdf-block"

/** "indicadores-residencial-vila-nova-2026-10-27.pdf" */
export function pdfFileName(scope: string): string {
  const slug = scope
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `indicadores-${slug}-${todayIsoDate()}.pdf`
}

const MARGIN = 12
const GAP = 5
/** Sobra mínima (mm) para começar a fatiar um bloco alto na página corrente. */
const MIN_SLICE = 30
const PIXEL_RATIO = 2
/**
 * JPEG e não PNG: o painel é quase todo área chapada e o PNG de cada bloco
 * passava de 3 MB (15 MB numa obra só). Com fundo opaco, o JPEG não perde
 * transparência nenhuma e fica uma fração do tamanho.
 */
const JPEG_QUALITY = 0.92
/** Blocos cujo topo difere menos que isto (px) estão na mesma linha da grade. */
const SAME_ROW = 2

export interface PdfHeader {
  title: string
  subtitle: string
  /** Canto direito do cabeçalho: quando o arquivo foi gerado. */
  generatedAt: string
}

interface Palette {
  paper: string
  ink: [number, number, number]
  meta: [number, number, number]
}

/** Bloco capturado e a distância (px) dele até a borda esquerda da folha. */
interface Tile {
  canvas: HTMLCanvasElement
  left: number
}

/**
 * PDF do dashboard montado no navegador: cada bloco vira imagem e é
 * empilhado em A4 na mesma escala e posição da tela — cards lado a lado
 * continuam lado a lado —, pulando de página em vez de cortar um gráfico.
 *
 * A captura é de um CLONE fora da tela sob `data-theme="light"`: o relatório
 * sai em papel claro qualquer que seja o tema do app, sem a tela piscar.
 * `html-to-image` (e não html2canvas) porque desenha via SVG foreignObject com
 * o CSS do próprio navegador — o html2canvas não entende o `color-mix`/`oklch`
 * dos tokens. As duas libs só carregam no clique.
 */
export async function exportDashboardPdf(sheet: HTMLElement, header: PdfHeader, fileName: string): Promise<void> {
  const [{ toCanvas }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")])
  const stage = mountLightClone(sheet)

  try {
    const palette = readPalette(stage)
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true })
    const layout = new PageFlow(pdf, palette, stage.offsetWidth)
    layout.drawHeader(header)

    for (const row of groupRows(stage)) {
      const tiles: Tile[] = []
      // Em série: em paralelo, cada captura reembute as fontes e a memória dispara.
      for (const { block, left } of row) {
        tiles.push({ canvas: await toCanvas(block, { pixelRatio: PIXEL_RATIO, backgroundColor: palette.paper }), left })
      }
      layout.placeRow(tiles)
    }

    layout.numberPages()
    pdf.save(fileName)
  } finally {
    stage.remove()
  }
}

function mountLightClone(sheet: HTMLElement): HTMLElement {
  const stage = document.createElement("div")
  stage.setAttribute("data-theme", "light")
  stage.className = "bg-surface text-ink"
  // Fora da tela, mas renderizado: em `display: none` não há estilo computado
  // para copiar. Largura igual à original, porque os SVGs do Recharts já vêm
  // com o tamanho em pixel medido na tela.
  Object.assign(stage.style, { position: "fixed", left: "-100000px", top: "0", width: `${sheet.offsetWidth}px` })
  stage.appendChild(sheet.cloneNode(true))
  document.body.appendChild(stage)
  return stage
}

/** Blocos agrupados por linha da grade, de cima para baixo e da esquerda para a direita. */
function groupRows(stage: HTMLElement): { block: HTMLElement; left: number }[][] {
  const origin = stage.getBoundingClientRect()
  const placed = [...stage.querySelectorAll<HTMLElement>(`[${PDF_BLOCK_ATTR}]`)]
    .map((block) => {
      const rect = block.getBoundingClientRect()
      return { block, top: rect.top - origin.top, left: rect.left - origin.left }
    })
    .sort((a, b) => a.top - b.top || a.left - b.left)

  const rows: { block: HTMLElement; left: number; top: number }[][] = []
  for (const item of placed) {
    const row = rows.at(-1)
    if (row && Math.abs(row[0].top - item.top) < SAME_ROW) row.push(item)
    else rows.push([item])
  }
  return rows
}

function readPalette(stage: HTMLElement): Palette {
  const style = getComputedStyle(stage)
  const meta = document.createElement("span")
  meta.className = "text-meta"
  stage.appendChild(meta)
  const metaColor = getComputedStyle(meta).color
  meta.remove()
  return { paper: style.backgroundColor, ink: toRgb(style.color), meta: toRgb(metaColor) }
}

/** `rgb(r, g, b)` computado → trio para o jsPDF, que não lê CSS. */
function toRgb(color: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number)
  return [r, g, b]
}

/** Cursor vertical sobre as páginas do PDF, numa escala fixa px → mm. */
class PageFlow {
  private y = MARGIN
  private readonly pdf: JsPdf
  private readonly palette: Palette
  private readonly width: number
  private readonly height: number
  /** mm por pixel do canvas: a folha inteira ocupa a largura útil da página. */
  private readonly scale: number

  constructor(pdf: JsPdf, palette: Palette, sheetWidth: number) {
    this.pdf = pdf
    this.palette = palette
    this.width = pdf.internal.pageSize.getWidth()
    this.height = pdf.internal.pageSize.getHeight()
    this.scale = (this.width - 2 * MARGIN) / (sheetWidth * PIXEL_RATIO)
    this.paint()
  }

  drawHeader(header: PdfHeader): void {
    const { pdf, palette } = this
    pdf.setTextColor(...palette.ink)
    pdf.setFont("helvetica", "bold").setFontSize(15).text(header.title, MARGIN, this.y + 5)
    pdf.setTextColor(...palette.meta)
    pdf.setFont("helvetica", "normal").setFontSize(9)
    pdf.text(header.subtitle, MARGIN, this.y + 11)
    pdf.text(header.generatedAt, this.width - MARGIN, this.y + 5, { align: "right" })
    pdf.setDrawColor(...palette.meta).setLineWidth(0.2).line(MARGIN, this.y + 14, this.width - MARGIN, this.y + 14)
    this.y += 14 + GAP
  }

  /** Linha inteira na página se couber nela; um bloco sozinho maior que a página é fatiado. */
  placeRow(tiles: Tile[]): void {
    const rowHeight = Math.max(...tiles.map((tile) => tile.canvas.height * this.scale))
    if (tiles.length === 1 && rowHeight > this.height - 2 * MARGIN) {
      this.slice(tiles[0])
      return
    }

    if (this.y + rowHeight > this.height - MARGIN) this.newPage()
    for (const tile of tiles) this.draw(tile.canvas, tile.left)
    this.y += rowHeight + GAP
  }

  numberPages(): void {
    const total = this.pdf.getNumberOfPages()
    this.pdf.setFont("helvetica", "normal").setFontSize(8).setTextColor(...this.palette.meta)
    for (let page = 1; page <= total; page++) {
      this.pdf.setPage(page)
      this.pdf.text(`${page} / ${total}`, this.width - MARGIN, this.height - MARGIN / 2, { align: "right" })
    }
  }

  private draw(canvas: HTMLCanvasElement, left: number): void {
    const x = MARGIN + left * PIXEL_RATIO * this.scale
    this.pdf.addImage(toJpeg(canvas), "JPEG", x, this.y, canvas.width * this.scale, canvas.height * this.scale)
  }

  private slice(tile: Tile): void {
    let sourceY = 0
    while (sourceY < tile.canvas.height) {
      if (this.height - MARGIN - this.y < MIN_SLICE) this.newPage()
      const slicePx = Math.min(tile.canvas.height - sourceY, Math.floor((this.height - MARGIN - this.y) / this.scale))
      this.draw(crop(tile.canvas, sourceY, slicePx), tile.left)
      this.y += slicePx * this.scale + GAP
      sourceY += slicePx
    }
  }

  private newPage(): void {
    this.pdf.addPage()
    this.paint()
    this.y = MARGIN
  }

  /** Papel da página na cor de superfície do tema claro, a mesma dos cards. */
  private paint(): void {
    this.pdf.setFillColor(...toRgb(this.palette.paper))
    this.pdf.rect(0, 0, this.width, this.height, "F")
  }
}

function toJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY)
}

function crop(canvas: HTMLCanvasElement, sourceY: number, height: number): HTMLCanvasElement {
  const slice = document.createElement("canvas")
  slice.width = canvas.width
  slice.height = height
  slice.getContext("2d")?.drawImage(canvas, 0, sourceY, canvas.width, height, 0, 0, canvas.width, height)
  return slice
}
