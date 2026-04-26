import { ChevronDown } from "lucide-react"
import type { InterfaceSelectProps } from "./SelectInterface"
import { tv } from "tailwind-variants"

const select = tv({
  base: "w-full bg-white text-slate-900 px-5 py-4 rounded-xl outline-none focus:ring-2 focus:ring-amber-400 transition-all appearance-none cursor-pointer",
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
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {prefix}
        </span>
      )}
      <select className={select({ withPrefix: !!prefix, className})} {...props}>
        {children}
      </select>
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <ChevronDown size={20} />
      </span>
    </div>
  )
}