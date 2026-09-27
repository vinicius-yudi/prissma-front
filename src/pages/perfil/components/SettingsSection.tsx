import type { ReactNode } from "react"

interface SettingsSectionProps {
  title: string
  children: ReactNode
}

/** Grupo de opções do perfil: título `t-label` (sem caixa alta) sobre um card. */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="rounded-lg bg-surface p-2 hairline">
      <h2 className="t-label px-3 pt-2 pb-1 text-ink-3">{title}</h2>
      {children}
    </section>
  )
}
