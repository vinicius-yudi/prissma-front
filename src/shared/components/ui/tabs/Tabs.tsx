import { motion } from "motion/react"
import type { ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"

export interface TabItem {
  to: string
  label: ReactNode
  icon?: ReactNode
  count?: number
  /** Ponto `danger`: a aba tem atraso ou estouro. */
  alert?: boolean
}

const link = tv({
  base: "relative inline-flex h-12 flex-none items-center gap-2 px-3 text-[14px] font-semibold whitespace-nowrap transition-colors",
  variants: {
    active: {
      true: "text-ink",
      false: "text-ink-3 hover:text-ink-2",
    },
  },
})

const count = tv({
  base: "t-num text-[11.5px]",
  variants: {
    active: {
      true: "text-gold-hi",
      false: "text-ink-3",
    },
  },
})

interface TabsProps {
  items: TabItem[]
  /** Único na tela: nomeia o sublinhado compartilhado que desliza. */
  id: string
  label: string
  className?: string
}

const nav = tv({
  base: "flex gap-1 overflow-x-auto shadow-[inset_0_-1px_0_var(--border)] scrollbar-none",
})

/**
 * Abas de rota (DS v2, Tabs) — uma página por aba.
 *
 * A ativa leva texto `ink` e um sublinhado ouro de 2.5px que desliza entre as
 * abas. Contagem ao lado e ponto `danger` quando a aba tem problema — o
 * usuário vê onde está o atraso sem abrir. No mobile rolam na horizontal.
 */
export function Tabs({ items, id, label, className }: TabsProps) {
  return (
    <nav aria-label={label} className={nav({ className })}>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} replace className={({ isActive }) => link({ active: isActive })}>
          {({ isActive }) => (
            <>
              {item.icon}
              {item.label}
              {item.count !== undefined && <span className={count({ active: isActive })}>{item.count}</span>}
              {item.alert && <span className="size-1.5 rounded-full bg-danger" aria-hidden="true" />}
              {isActive && (
                <motion.span
                  layoutId={`tab-${id}`}
                  className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-gold"
                  transition={SPRING}
                />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
