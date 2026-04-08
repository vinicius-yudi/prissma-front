import { tv } from "tailwind-variants"
import type { InterfaceLabelProps } from "./LabelInterface"

const label = tv({
  base: "block text-sm font-medium [color:#8ad3d6]",
})

export function Label({ className, children, ...props }: InterfaceLabelProps) {
  return (
    <label className={label({ className })} {...props}>
      {children}
    </label>
  )
}
