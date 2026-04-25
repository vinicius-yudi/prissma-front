import { tv } from "tailwind-variants"
import type { InterfaceButtonProps } from "./ButtonInterface"

const button = tv({
  base: "w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer",
  variants: {
    variant: {
      primary: "text-white bg-primary hover:bg-primary/90 cursor-pointer transition-all",
      outline: "bg-transparent border-2 border-primary text-secondary hover:bg-primary hover:text-white cursor-pointer transition-all",
      ghost: "bg-transparent border-0 text-secondary hover:bg-surface-container-high cursor-pointer transition-all",
    },
  },
  defaultVariants: {
    variant: "primary",
  },
})

export function Button({ variant, className, children, ...props }: InterfaceButtonProps) {
  return (
    <button className={button({ variant, className })} {...props}>
      {children}
    </button>
  )
}
