import { tv } from "tailwind-variants"
import type { InterfaceButtonProps } from "./ButtonInterface"

const button = tv({
  base: "w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer",
  variants: {
    variant: {
      primary: "text-white [background:#01534c] hover:bg-transparent hover:[border:2px_solid_#01534c] hover:[color:#8ad3d6] cursor-pointer transition-all",
      outline: "bg-transparent [border:2px_solid_#01534c] [color:#8ad3d6] hover:[background:#01534c] hover:text-white cursor-pointer transition-all",
      ghost: "bg-transparent border-0 [color:#01534c] hover:bg-transparent hover:border-0 hover:text-white cursor-pointer transition-all",
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
