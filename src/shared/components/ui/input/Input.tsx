import { tv } from "tailwind-variants"
import type { InterfaceInputProps } from "./InputInterface"

const input = tv({
  base: "w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant px-5 py-4 rounded-xl outline-none border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all",
  variants: {
    withSuffix: {
      true: "pr-12",
    },
  },
})

export function Input({ suffix, className, ...props }: InterfaceInputProps) {
  return (
    <div className="relative">
      <input className={input({ withSuffix: !!suffix, className })} {...props} />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
          {suffix}
        </span>
      )}
    </div>
  )
}
