import type { SelectHTMLAttributes, ReactNode } from "react"

export interface InterfaceSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'prefix'> {
  prefix?: ReactNode
  /** Classe do contêiner (onde o chevron se ancora); padrão `w-full`. Use `w-auto` para o campo ocupar só o conteúdo. */
  wrapperClassName?: string
}