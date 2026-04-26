import type { SelectHTMLAttributes, ReactNode } from "react"

export interface InterfaceSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'prefix'> {
  prefix?: ReactNode
}