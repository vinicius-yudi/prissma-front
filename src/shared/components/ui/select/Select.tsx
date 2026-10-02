import { ChevronDown } from "lucide-react"
import { tv } from "tailwind-variants"

import { fieldBase } from "../input/fieldStyles"
import type { InterfaceSelectProps } from "./SelectInterface"

/** Contêiner onde o chevron se ancora; `wrapperClassName` sobrescreve a largura via tailwind-merge. */
const wrapper = tv({ base: "relative w-full" })

const select = tv({
  base: [
    ...fieldBase,
    "h-11 cursor-pointer appearance-none px-3.5 pr-10",
    "[&_option]:bg-surface [&_option]:text-ink",
  ],
  variants: {
    withPrefix: {
      true: "pl-10",
    },
  },
})

export function Select({ prefix, className, wrapperClassName, children, ...props }: InterfaceSelectProps) {
  return (
    <div className={wrapper({ className: wrapperClassName })}>
      {prefix && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2">
          {prefix}
        </span>
      )}
      <select className={select({ withPrefix: !!prefix, className })} {...props}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-meta">
        <ChevronDown size={16} />
      </span>
    </div>
  )
}
