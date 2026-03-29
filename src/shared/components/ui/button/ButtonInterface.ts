import type { ButtonHTMLAttributes } from "react"

interface InterfaceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline"
}

export type { InterfaceButtonProps }
