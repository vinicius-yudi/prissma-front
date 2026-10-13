import { tv } from "tailwind-variants"

import { LogoMark } from "./LogoMark"
import { LOGO_TRANSFORM, WORDMARK_PATHS, WORDMARK_VIEWBOX } from "./logoPaths"

const lockup = tv({
  base: "inline-flex items-center gap-2.5 text-logo",
})

interface LogoProps {
  /** Altura do símbolo em px; a palavra acompanha. */
  size?: number
  className?: string
}

/** Símbolo + palavra PRISSMA, lado a lado (sidebar, telas públicas). */
export function Logo({ size = 26, className }: LogoProps) {
  const wordHeight = size * 0.46

  return (
    <span className={lockup({ className })} role="img" aria-label="PRISSMA">
      <LogoMark size={size} decorative />
      <svg viewBox={WORDMARK_VIEWBOX} height={wordHeight} width={(wordHeight * 286) / 45} aria-hidden="true">
        <g transform={LOGO_TRANSFORM} fill="currentColor">
          {WORDMARK_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
    </span>
  )
}
