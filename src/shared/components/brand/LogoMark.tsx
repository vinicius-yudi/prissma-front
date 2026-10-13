import { tv } from "tailwind-variants"

import { LOGO_TRANSFORM, MARK_PATHS, MARK_VIEWBOX } from "./logoPaths"

const mark = tv({
  base: "flex-none text-logo",
})

interface LogoMarkProps {
  /** Altura em px — mínimo 20 (DS, Logos). */
  size?: number
  className?: string
  /** Sem rótulo quando há texto "PRISSMA" ao lado. */
  decorative?: boolean
}

/** Símbolo oficial do PRISSMA, na cor `logo` do tema. */
export function LogoMark({ size = 28, className, decorative = false }: LogoMarkProps) {
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      height={size}
      width={(size * 112) / 76}
      className={mark({ className })}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "PRISSMA"}
      aria-hidden={decorative ? true : undefined}
    >
      <g transform={LOGO_TRANSFORM} fill="currentColor">
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
