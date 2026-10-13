/**
 * Lê valor digitado em reais: "1.234,56", "1234,56" e "1234.56" viram
 * 1234.56. Com vírgula, ponto é milhar; sem vírgula, o ponto é decimal (é
 * como o valor volta do servidor ao editar). Vazio ou inválido vira `NaN`,
 * que o schema recusa com a mensagem certa.
 */
export function parseMoney(value: unknown): number {
  if (typeof value === "number") return value
  const text = String(value ?? "").replace(/[^\d.,-]/g, "")
  if (!text) return Number.NaN
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text
  return Number(normalized)
}

/** Valor para o campo de texto: 1234.5 → "1234,50". */
export function moneyInput(value: number): string {
  return value ? value.toFixed(2).replace(".", ",") : ""
}
