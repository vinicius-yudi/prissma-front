import { tv } from "tailwind-variants"
import type { InterfaceInputProps } from "./InputInterface"

const input = tv({
  base: "w-full bg-white text-slate-900 px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 transition-all",
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
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          {suffix}
        </span>
      )}
    </div>
  )
}
