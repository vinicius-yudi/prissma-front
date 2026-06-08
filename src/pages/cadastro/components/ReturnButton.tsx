import type { ComponentType, ReactNode } from "react"
import { tv } from "tailwind-variants"

interface ReturnButtonProps {
  icon: ComponentType<{ className?: string }>
  onClick: () => void
  children: ReactNode
}

const button = tv({
  base: "group flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-[#94a3b8] transition-colors cursor-pointer hover:text-[#f8fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]",
})

const iconRing = tv({
  base: "flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#3b82f6] text-[#3b82f6] transition-colors group-hover:border-[#f8fafc] group-hover:text-[#f8fafc]",
})

export function ReturnButton({ icon: Icon, onClick, children }: ReturnButtonProps) {
  return (
    <button type="button" onClick={onClick} className={button()}>
      <span className={iconRing()}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      {children}
    </button>
  )
}
