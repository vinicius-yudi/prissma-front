import { tv } from "tailwind-variants"

import { useOncePerPage } from "../page-chrome/PageChrome"
import type { InterfaceButtonProps } from "./ButtonInterface"

/**
 * Botões.
 *
 * "Ouro com parcimônia": o gradiente marca só a ação primária — nunca dois
 * destaques concorrentes na mesma vista (Style Guide v2 §1). O `primary`
 * registra-se na guarda de tela para que a segunda ocorrência apareça no
 * console em desenvolvimento.
 */

const button = tv({
  base: "inline-flex cursor-pointer items-center justify-center font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
  variants: {
    variant: {
      primary: "bg-gold-grad text-on-primary hover:shadow-glow hover:brightness-110",
      outline: "border border-outline bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
      ghost: "bg-transparent text-gold-bright hover:bg-tint",
      destructive: "bg-danger-bg text-danger hover:brightness-110",
      menu: "text-on-surface-variant hover:bg-tint hover:text-on-surface",
      menuSelected: "bg-tint text-on-surface",
    },
    size: {
      // Altura 38–44px e raio 12px são do design.
      md: "min-h-[38px] gap-2 rounded-xl px-4 py-2.5",
      sm: "min-h-[30px] gap-1.5 rounded-lg px-3 py-1.5 text-xs",
    },
    fullWidth: {
      true: "w-full",
      false: "w-auto",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
    fullWidth: true,
  },
})

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = true,
  className,
  children,
  ...props
}: InterfaceButtonProps) {
  useOncePerPage("primaryButton", variant === "primary")

  return (
    <button className={button({ variant, size, fullWidth, className })} {...props}>
      {children}
    </button>
  )
}
