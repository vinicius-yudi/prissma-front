import type { InputHTMLAttributes, ReactNode } from "react"

interface InterfaceInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'>{
  suffix?: ReactNode
  prefix?: ReactNode
}

export type { InterfaceInputProps }
