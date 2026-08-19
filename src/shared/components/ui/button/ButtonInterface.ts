import type { ButtonHTMLAttributes } from "react"

interface InterfaceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost" | "menu" | "menuSelected"
}

export type { InterfaceButtonProps }
