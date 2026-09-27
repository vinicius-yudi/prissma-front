import { tv } from "tailwind-variants"

import { useOncePerPage } from "../page-chrome/PageChrome"
import type { InterfaceButtonProps } from "./ButtonInterface"

/**
 * Botões (DS v2) — quatro papéis fixos.
 *
 * - `primary`: gradiente ouro. **Uma por vista** — a ação que move a obra
 *   (Nova obra, Lançar despesa, Registrar no diário). Registra-se na guarda
 *   de tela para que a segunda ocorrência apareça no console em dev.
 * - `outline`: contorno `border-strong` sobre `surface`. Secundária do mesmo
 *   contexto (Editar obra, Cancelar no modal).
 * - `ghost`: a "quieta" do DS — texto `gold-hi`, sem fundo. "Ver todas ›".
 * - `destructive`: `danger` sobre `danger-soft`. Só destrutivas, sempre com
 *   Desfazer no toast depois.
 *
 * Pressionar reduz para 97%. No claro o rótulo sobre o ouro fica em peso 620
 * (contraste do início do gradiente).
 */

const button = tv({
  base: [
    "inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap font-[620]",
    "transition-[transform,filter,background-color,color] duration-150 active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  variants: {
    variant: {
      primary: "bg-gold-grad text-on-gold hover:brightness-108",
      outline: "bg-surface text-ink hairline-strong hover:bg-raised",
      ghost: "bg-transparent text-gold-hi hover:bg-raised",
      destructive: "bg-danger-soft text-danger hover:brightness-110",
      menu: "text-ink-2 hover:bg-raised hover:text-ink",
      menuSelected: "bg-gold-soft text-ink",
    },
    size: {
      md: "h-11 gap-2 rounded-md px-4 text-[14px]",
      sm: "h-9 gap-1.5 rounded-sm px-3 text-[13px]",
      icon: "size-10 rounded-[10px]",
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
