import type { ReactNode, ComponentType } from "react"
import { Button } from "@/shared/components/ui/button/Button"
import type { InterfaceButtonProps } from "@/shared/components/ui/button/ButtonInterface"

interface ReturnButtonProps extends InterfaceButtonProps {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}

export function ReturnButton({ icon: Icon, children, ...props }: ReturnButtonProps) {
  return (
    <Button variant="ghost" className="group" {...props}>
      <div className="w-6 h-6 rounded-full border-2 border-[#01534c] flex items-center justify-center flex-shrink-0 group-hover:border-white transition-colors duration-200">
        <Icon className="w-4 h-4 text-[#01534c] group-hover:text-white transition-colors duration-200" />
      </div>
      {children}
    </Button>
  )
}