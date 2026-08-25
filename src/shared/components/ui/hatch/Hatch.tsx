/**
 * Hachura diagonal — assinatura da marca.
 *
 * Significado fixo: **previsto ou indisponível**. Barra de gráfico ainda não
 * realizada, dia fora do mês no calendário, slot vago. Não usar como textura
 * decorativa (Style Guide v2 §4).
 */

interface HatchProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export function Hatch({ children, className = "", ...props }: HatchProps) {
  return (
    <div className={`bg-surface-container-low bg-hatch ${className}`} {...props}>
      {children}
    </div>
  )
}
