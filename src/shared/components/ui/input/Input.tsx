import { tv } from "tailwind-variants"
import type { InterfaceInputProps } from "./InputInterface"

const input = tv({
  base: "w-full bg-white text-slate-900 px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 transition-all",
  variants: {
    withSuffix: {
      true: "pr-12",
    },
    withPrefix: {
      true: "pl-10",
    },
  },
})

export function Input({ suffix, prefix, className, ...props }: InterfaceInputProps) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 flex items-center justify-center">
          {prefix}
        </span>
      )}
      <input className={input({ withSuffix: !!suffix, withPrefix: !!prefix, className })} {...props} />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}
