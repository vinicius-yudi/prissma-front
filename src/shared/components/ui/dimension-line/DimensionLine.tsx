import { tv } from "tailwind-variants"

import { useOncePerPage } from "../page-chrome/PageChrome"

/**
 * Legenda técnica sob o H1 — **uma por tela**.
 *
 * Nasceu como cota de desenho técnico (traços verticais nas pontas e linha de
 * 1px atravessando o texto). Os traços saíram: repetidos em toda página viravam
 * moldura, e o que carrega a informação — código da obra, endereço, início — é
 * o texto em mono. A regra de uma ocorrência por tela continua valendo
 * (Style Guide v2 §4), por isso o registro no <PageChrome> ficou.
 */

const caption = tv({
  base: "font-mono text-[10.5px] tracking-[0.05em] text-on-surface-faint",
})

interface DimensionLineProps {
  children: React.ReactNode
  className?: string
}

export function DimensionLine({ children, className }: DimensionLineProps) {
  useOncePerPage("dimensionLine")

  return <p className={caption({ className })}>{children}</p>
}
