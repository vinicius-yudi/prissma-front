import { forwardRef } from "react"
import { tv } from "tailwind-variants"
import type { InterfaceInputProps } from "./InputInterface"

const input = tv({
  base: "w-full bg-surface-container text-on-surface text-sm placeholder:text-on-surface-variant px-4 py-2.5 rounded-lg outline-none border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all",
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
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-faint flex items-center justify-center">
            {prefix}
          </span>
        )}
        <input ref={ref} className={input({ withSuffix: !!suffix, withPrefix: !!prefix, className })} {...props} />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)
