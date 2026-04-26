import { tv } from "tailwind-variants"
import type { InterfaceButtonProps } from "./ButtonInterface"

const button = tv({
  base: "w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer",
  variants: {
    variant: {
      primary: "text-on-primary bg-primary hover:bg-transparent hover:border-2 hover:border-primary hover:text-primary cursor-pointer transition-all",
      outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-on-primary cursor-pointer transition-all",
      ghost: "bg-transparent border-0 text-primary hover:text-white cursor-pointer transition-all",
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
