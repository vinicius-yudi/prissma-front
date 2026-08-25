/**
 * Valor de dado em JetBrains Mono.
 *
 * Moeda, datas, percentuais, horas, códigos de obra e contadores usam mono —
 * inclusive dentro de badges e tooltips. Texto corrido **nunca** usa mono
 * (Style Guide v2 §3). O alinhamento tabular mantém colunas estáveis quando o
 * valor muda.
 */

interface NumProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode
}

export function Num({ children, className = "", ...props }: NumProps) {
  return (
    <span className={`font-mono tabular-nums ${className}`} {...props}>
      {children}
    </span>
  )
}
