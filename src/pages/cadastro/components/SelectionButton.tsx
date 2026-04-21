import type { ReactNode, ComponentType } from "react"
import { Button } from "@/shared/components/ui/button/Button"
import type { InterfaceButtonProps } from "@/shared/components/ui/button/ButtonInterface"

interface SelectionButtonProps extends InterfaceButtonProps {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}

export function SelectionButton({ icon: Icon, children, ...props }: SelectionButtonProps) {
  return (
    <Button {...props}>
      <Icon className="w-5 h-5" />
      {children}
    </Button>
  )
}
