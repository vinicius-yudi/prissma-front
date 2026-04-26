import { tv } from "tailwind-variants"
import type { InterfaceButtonProps } from "./ButtonInterface"

const button = tv({
  base: "w-full font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
  variants: {
    variant: {
      primary: "text-on-primary bg-primary hover:brightness-[0.92]",
      outline: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10",
      ghost: "bg-transparent border-0 text-primary hover:bg-primary/[0.08]",
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
