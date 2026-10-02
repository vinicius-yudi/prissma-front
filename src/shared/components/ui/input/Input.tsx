import { forwardRef } from "react"
import { tv } from "tailwind-variants"
import { fieldBase } from "./fieldStyles"
import type { InterfaceInputProps } from "./InputInterface"

const input = tv({
  base: [...fieldBase, "h-11 px-3.5"],
  variants: {
    withSuffix: {
      true: "pr-12",
    },
    withPrefix: {
      true: "pl-10",
    },
  },
})

export const Input = forwardRef<HTMLInputElement, InterfaceInputProps>(
  function Input({ suffix, prefix, className, ...props }, ref) {
    return (
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-meta">
            {prefix}
          </span>
        )}
        <input ref={ref} className={input({ withSuffix: !!suffix, withPrefix: !!prefix, className })} {...props} />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)
