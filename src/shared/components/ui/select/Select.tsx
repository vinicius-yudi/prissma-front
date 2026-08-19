import { ChevronDown } from "lucide-react"
import { tv } from "tailwind-variants"

import type { InterfaceSelectProps } from "./SelectInterface"

const select = tv({
  base: [
    "w-full bg-surface-container text-on-surface text-sm",
    "px-4 py-2.5 pr-10 rounded-lg outline-none",
    "border border-outline-variant",
    "focus:border-primary focus:ring-2 focus:ring-primary/30",
    "transition-all appearance-none cursor-pointer",
    "[&_option]:bg-surface-container [&_option]:text-on-surface",
  ],
  variants: {
    withPrefix: {
      true: "pl-10",
    },
  },
})

export function Select({ prefix, className, children, ...props }: InterfaceSelectProps) {
  return (
    <div className="relative w-full">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          {prefix}
        </span>
      )}
      <select className={select({ withPrefix: !!prefix, className })} {...props}>
        {children}
      </select>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
        <ChevronDown size={16} />
      </span>
    </div>
  )
}
