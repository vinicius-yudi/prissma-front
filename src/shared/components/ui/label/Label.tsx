import { tv } from "tailwind-variants"
import type { InterfaceLabelProps } from "./LabelInterface"

// Rótulo é texto de apoio (Style Guide v2 §3), não destaque. Estava em
// `text-success`, que aponta para o verde semântico — o que deixava **todos**
// os rótulos de formulário do sistema verdes.
const label = tv({
  base: "block text-sm font-medium text-ink-2",
})

export function Label({ className, children, ...props }: InterfaceLabelProps) {
  return (
    <label className={label({ className })} {...props}>
      {children}
    </label>
  )
}
