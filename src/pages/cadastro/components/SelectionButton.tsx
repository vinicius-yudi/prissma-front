import { ArrowRight } from "lucide-react"
import type { ComponentType, ReactNode } from "react"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"
import type { InterfaceButtonProps } from "@/shared/components/ui/button/ButtonInterface"

/**
 * Escolha de perfil no cadastro.
 *
 * Usa `outline`, não `primary`: são três botões lado a lado e o gradiente ouro
 * é de uma ação por vista (Style Guide v2 §5) — em `primary` os três disputavam
 * o mesmo destaque e disparavam a guarda de tela do <Button>. O realce fica no
 * hover: borda ouro, ícone em selo e a seta avançando.
 */

const selection = tv({
  base: "group h-14 justify-start px-4 text-sm hover:border-primary",
})

const iconBadge = tv({
  base: "flex size-9 items-center justify-center rounded-lg bg-surface-container-high text-gold-bright transition-colors group-hover:bg-gold-grad group-hover:text-on-primary",
})

interface SelectionButtonProps extends InterfaceButtonProps {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}

export function SelectionButton({ icon: Icon, children, className, ...props }: SelectionButtonProps) {
  return (
    <Button variant="outline" className={selection({ className })} {...props}>
      <span className={iconBadge()}>
        <Icon className="size-5" />
      </span>
      <span className="flex-1 text-left">{children}</span>
      <ArrowRight
        size={18}
        className="text-on-surface-faint transition-transform duration-200 group-hover:translate-x-1 group-hover:text-gold-bright"
      />
    </Button>
  )
}
