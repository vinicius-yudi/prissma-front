import { tv } from "tailwind-variants"

/**
 * Valor de dado em JetBrains Mono.
 *
 * Moeda, datas, percentuais, horas, códigos de obra e contadores usam mono —
 * inclusive dentro de badges e tooltips. Texto corrido **nunca** usa mono
 * (Style Guide v2 §3). O alinhamento tabular mantém colunas estáveis quando o
 * valor muda.
 */

const num = tv({
  base: "font-mono tabular-nums",
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
