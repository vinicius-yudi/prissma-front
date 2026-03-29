import type { InputHTMLAttributes, ReactNode } from "react"

interface InterfaceInputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: ReactNode
}

export type { InterfaceInputProps }
