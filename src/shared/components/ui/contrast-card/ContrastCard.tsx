import { tv } from "tailwind-variants"

import { useOncePerPage } from "../page-chrome/PageChrome"

/**
 * Card de contraste — superfície invertida (creme no escuro, branca no claro).
 *
 * Reservado ao conteúdo protagonista da tela, como a lista de tarefas do dia.
 * **No máximo um por tela**: duas superfícies invertidas competindo anulam o
 * efeito e achatam a hierarquia (Style Guide v2 §5).
 *
 * Componentes filhos que precisam de status devem usar a variante `light` do
 * StatusBadge — as cores normais não têm contraste sobre esta superfície.
 */

const card = tv({
  base: "rounded-2xl bg-contrast p-5 text-on-contrast",
})

interface ContrastCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ContrastCard({ children, className, ...props }: ContrastCardProps) {
  useOncePerPage("contrastCard")

  return (
    <div
      className={card({ className })}
      {...props}
    >
      {children}
    </div>
  )
}
