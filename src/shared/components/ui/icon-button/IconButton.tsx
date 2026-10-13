import { forwardRef } from "react"
import type { ButtonHTMLAttributes } from "react"
import { tv } from "tailwind-variants"

const iconButton = tv({
  base: [
    "inline-flex size-10 flex-none cursor-pointer items-center justify-center rounded-[10px] text-ink-2",
    "transition-colors hover:bg-raised hover:text-ink",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
})

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Obrigatório: é o nome acessível e a dica ao passar o mouse. */
  label: string
}

/** Botão só de ícone, 40×40. O rótulo vira `aria-label` e `title`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={iconButton({ className })}
      {...props}
    >
      {children}
    </button>
  )
})
