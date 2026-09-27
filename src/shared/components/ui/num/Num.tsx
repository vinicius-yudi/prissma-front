import { tv } from "tailwind-variants"

/**
 * Valor de dado: Archivo estreito (`wdth` 94) e tabular.
 *
 * Moeda, datas, percentuais, horas, códigos de obra e contadores passam por
 * aqui — inclusive dentro de badges e tooltips. Substitui a mono da v1: as
 * colunas continuam alinhadas quando o valor muda, sem trocar de família no
 * meio da frase.
 */

const num = tv({
  base: "t-num",
})

interface NumProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export function Num({ children, className, ...props }: NumProps) {
  return (
    <span className={num({ className })} {...props}>
      {children}
    </span>
  )
}
