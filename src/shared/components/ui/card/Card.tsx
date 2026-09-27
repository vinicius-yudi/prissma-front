import type { HTMLAttributes } from "react"
import { tv } from "tailwind-variants"

/**
 * Superfície padrão de conteúdo (DS v2, Card): `surface`, raio 16px e
 * hairline. Sem sombra em repouso — profundidade vem da troca de superfície,
 * não de sombra. `interactive` sobe 2px com `shadow-soft` no hover, para card
 * que é link (obra, tarefa).
 */
const card = tv({
  base: "rounded-lg bg-surface hairline",
  variants: {
    padded: {
      true: "p-5",
    },
    interactive: {
      true: "transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transition-none",
    },
  },
  defaultVariants: {
    padded: true,
  },
})

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  interactive?: boolean
}

export function Card({ padded, interactive, className, children, ...props }: CardProps) {
  return (
    <div className={card({ padded, interactive, className })} {...props}>
      {children}
    </div>
  )
}
