/**
 * Barra de progresso com trena — assinatura da marca.
 *
 * Todo preenchimento carrega as marcações da trena (traços a cada 8px)
 * sobre a cor. Este é o **único** lugar do código autorizado a desenhar uma
 * barra de progresso: barra crua em qualquer outro arquivo perde a assinatura
 * e é o tipo de detalhe que dilui a identidade (Style Guide v2 §4).
 */

export type ProgressTone = "gold" | "ok" | "warn" | "danger"

// A trena é background-image, então o preenchimento também precisa ser: cor
// sólida vira gradiente de um tom só para poder empilhar sob as marcações.
//
// `warn` não está no Style Guide, que só prevê grad/ok/perigo. Entra porque o
// orçamento tem um estado real de "chegando no limite" (≥80%) que sem ele
// ficaria indistinguível do curso normal.
const FILL: Record<ProgressTone, string> = {
  gold: "var(--pk-grad)",
  ok: "linear-gradient(90deg, var(--pk-ok), var(--pk-ok))",
  warn: "linear-gradient(90deg, var(--pk-wn), var(--pk-wn))",
  danger: "linear-gradient(90deg, var(--color-danger-solid), var(--color-danger-solid))",
}

interface ProgressProps {
  /** 0–100. Valores fora da faixa são achatados. */
  value: number
  tone?: ProgressTone
  /** Altura da trilha em px. O design usa 4 na sidebar, 6–10 no conteúdo. */
  height?: number
  label?: string
  className?: string
}

export function Progress({
  value,
  tone = "gold",
  height = 8,
  label,
  className = "",
}: ProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-surface-container-highest ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${pct}%`,
          backgroundImage: `var(--pk-trena), ${FILL[tone]}`,
        }}
      />
    </div>
  )
}
