import type { InputHTMLAttributes, ReactNode } from "react"
import { forwardRef } from "react"
import { tv } from "tailwind-variants"

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string
  icon: ReactNode
  suffix?: ReactNode
}

const field = tv({
  base: "w-full h-13 rounded-xl bg-[#101b2d] text-[#f8fafc] text-sm placeholder:text-[#64748b] pl-12 outline-none border border-[#1e2a3d] transition-all duration-200 focus:border-[#3b82f6] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.18),0_0_24px_rgba(59,130,246,0.25)]",
  variants: {
    withSuffix: {
      true: "pr-12",
      false: "pr-4",
    },
  },
  defaultVariants: {
    withSuffix: false,
  },
})

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  function AuthInput({ label, icon, suffix, id, className, ...props }, ref) {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="block text-sm font-medium text-[#cbd5e1]">
          {label}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">
            {icon}
          </span>
          <input
            ref={ref}
            id={id}
            className={field({ withSuffix: !!suffix, className })}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {suffix}
            </span>
          )}
        </div>
      </div>
    )
  },
)
