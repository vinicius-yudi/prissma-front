import type { BudgetTone } from "./budgetMath"

/**
 * Cores dos gráficos de orçamento.
 *
 * São referências a variáveis CSS, não hex: o SVG do Recharts aceita
 * `fill="var(--gold)"`, então os gráficos passam a seguir a troca de tema
 * junto com o resto da interface — antes ficavam congelados no modo escuro.
 *
 * A rampa categórica sai da família ouro e só depois recorre às semânticas,
 * como no donut do protótipo (Mão de obra · Materiais · Equipamento ·
 * Serviços · Outros). Palette arco-íris genérica é o que dava cara de
 * template ao módulo mais denso do sistema.
 */

export const DONUT_COLORS = [
  "var(--gold)",
  "var(--gold-deep)",
  "var(--gold-hi)",
  "var(--success)",
  "var(--ink-3)",
  "var(--warning)",
  "var(--danger)",
] as const

export function donutColor(index: number): string {
  return DONUT_COLORS[index % DONUT_COLORS.length]
}

/** Barras por categoria: aqui a cor é semântica, não categórica. */
export const TONE_COLOR: Record<BudgetTone, string> = {
  ok: "var(--gold)",
  warning: "var(--warning)",
  exceeded: "var(--danger)",
}
