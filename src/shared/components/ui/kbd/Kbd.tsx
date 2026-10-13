import type { ReactNode } from "react"
import { tv } from "tailwind-variants"

const kbd = tv({
  base: "inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-raised px-1.5 text-[11px] font-semibold text-ink-2",
})

interface KbdProps {
  children: ReactNode
  className?: string
}

/** Tecla de atalho (⌘K, Esc, Enter). */
export function Kbd({ children, className }: KbdProps) {
  return <kbd className={kbd({ className })}>{children}</kbd>
}
