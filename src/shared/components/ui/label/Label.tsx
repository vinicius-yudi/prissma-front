import { tv } from "tailwind-variants"
import type { InterfaceLabelProps } from "./LabelInterface"

// Rótulo acima do campo, nunca placeholder como rótulo: `t-label` em `ink-2`
// (DS v2, Field).
const label = tv({
  base: "t-label block text-ink-2",
})

export function Label({ className, children, ...props }: InterfaceLabelProps) {
  return (
    <label className={label({ className })} {...props}>
      {children}
    </label>
  )
}
