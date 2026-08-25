import { EXTENSION_PATTERN } from "./regex"

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export function stripExtension(fileName: string): string {
  return fileName.replace(EXTENSION_PATTERN, "")
}

export function formatCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompactCurrency(value: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function todayIsoDate(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

/** Código da obra em mono, como no protótipo: OBRA-0142. */
export function formatObraCode(id: number): string {
  return `OBRA-${String(id).padStart(4, "0")}`
}
