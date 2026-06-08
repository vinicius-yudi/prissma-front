import type { ComponentType, ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { tv } from "tailwind-variants"

interface SelectionButtonProps {
  icon: ComponentType<{ className?: string }>
  onClick: () => void
  children: ReactNode
}

const selection = tv({
  base: "group flex h-14 w-full items-center gap-3 rounded-xl border border-[#1e2a3d] bg-[#101b2d] px-4 text-sm font-medium text-[#f8fafc] transition-all duration-200 cursor-pointer hover:border-[#3b82f6] hover:shadow-[0_0_24px_rgba(59,130,246,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa]",
})

const iconBadge = tv({
  base: "flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e2a3d] text-[#60a5fa] transition-colors group-hover:bg-[#2563eb] group-hover:text-white",
})

export function SelectionButton({ icon: Icon, onClick, children }: SelectionButtonProps) {
  return (
    <button type="button" onClick={onClick} className={selection()}>
      <span className={iconBadge()}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex-1 text-left">{children}</span>
      <ArrowRight size={18} className="text-[#64748b] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#60a5fa]" />
    </button>
  )
}
