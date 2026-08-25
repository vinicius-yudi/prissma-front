import { tv } from "tailwind-variants"

/**
 * Hachura diagonal — assinatura da marca.
 *
 * Significado fixo: **previsto ou indisponível**. Barra de gráfico ainda não
 * realizada, dia fora do mês no calendário, slot vago. Não usar como textura
 * decorativa (Style Guide v2 §4).
 */

const hatch = tv({
  base: "bg-surface-container-low bg-hatch",
})

interface HatchProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function Hatch({ children, className, ...props }: HatchProps) {
  return (
    <div className={hatch({ className })} {...props}>
      {children}
    </div>
  )
}
