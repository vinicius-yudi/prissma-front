import { tv } from "tailwind-variants"

/**
 * Trena — toda barra de progresso do PRISSMA (DS v2).
 *
 * Trilho `raised` com as marcações de trena (traço maior a cada 10%, menor a
 * cada 2%: dez traços grandes são 100% em qualquer largura) e, quando há
 * prazo, o marcador ▾ de onde a obra deveria estar hoje. Este é o **único**
 * lugar do código autorizado a desenhar uma barra de progresso: barra crua em
 * outro arquivo perde a assinatura.
 *
 * O preenchimento cresce uma vez, ao montar (`@starting-style`, sem JS), e o
 * marcador chega 0.2s depois. Com movimento reduzido, aparece pronto.
 */

export type ProgressTone = "gold" | "ok" | "warn" | "danger"

const fill = tv({
  base: [
    "absolute inset-y-0 left-0 origin-left rounded-l-[3px]",
    "transition-[width,scale] duration-700 ease-out-expo starting:scale-x-0",
    "motion-reduce:transition-none",
  ],
  variants: {
    tone: {
      // em andamento
      gold: "bg-gold-grad",
      // concluída
      ok: "bg-success",
      // categoria acima de 85%
      warn: "bg-warning",
      // etapa atrasada, categoria estourada
      danger: "bg-danger",
    },
  },
})

interface ProgressProps {
  /** 0–100. Valores fora da faixa são achatados. */
  value: number
  tone?: ProgressTone
  /** Onde o valor deveria estar hoje (0–100), ex.: `timeProgress` da obra. */
  expected?: number
  /**
   * Altura do trilho em px: 10 no conteúdo, 6 na variante fina das listas de
   * categoria. Abaixo de 8 as marcações somem — viram ruído.
   */
  height?: number
  label?: string
  className?: string
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function Progress({
  value,
  tone = "gold",
  expected,
  height = 10,
  label,
  className,
}: ProgressProps) {
  const pct = clamp(value)
  const showTicks = height >= 8

  return (
    <div className={className}>
      <div className="relative" style={{ paddingTop: expected === undefined ? 0 : 7 }}>
        <div
          className="relative overflow-hidden rounded-[3px] bg-raised"
          style={{ height }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div className={fill({ tone })} style={{ width: `${pct}%` }} />
          {showTicks && (
            <div className="tape-ticks pointer-events-none absolute inset-0 opacity-35" data-ticks />
          )}
        </div>

        {expected !== undefined && (
          <div
            className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col items-center transition-opacity delay-200 duration-500 starting:opacity-0 motion-reduce:transition-none"
            style={{ left: `${clamp(expected)}%` }}
            data-expected
          >
            <svg width="9" height="6" viewBox="0 0 9 6" className="text-ink" aria-hidden="true">
              <path d="M0 0h9L4.5 6z" fill="currentColor" />
            </svg>
            <div className="w-px bg-ink/70" style={{ height: height + 2 }} />
          </div>
        )}
      </div>
    </div>
  )
}
