import { tv } from "tailwind-variants"
import type { InterfaceLabelProps } from "./LabelInterface"

const label = tv({
  base: "block text-[12px] uppercase tracking-widest font-bold [color:#8ad3d6]",
})

export function Label({ className, children, ...props }: InterfaceLabelProps) {
  return (
    <label className={label({ className })} {...props}>
      {children}
    </label>
  )
}
