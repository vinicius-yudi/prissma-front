import type { ReactNode, SelectHTMLAttributes } from "react"

interface InterfaceSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
	children: ReactNode
}

export type { InterfaceSelectProps }
