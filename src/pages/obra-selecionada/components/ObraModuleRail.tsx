import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { NavLink, useLocation } from "react-router-dom"
import { tv } from "tailwind-variants"

import { OBRA_NAV } from "@/shared/constants/nav"
import { useAccess } from "@/shared/hooks/useAccess"

/**
 * Navegação entre os módulos da obra, no celular.
 *
 * A sidebar não existe abaixo de `lg` e a barra de abas é do workspace — sem
 * este trilho não haveria como sair da Visão geral para Etapas ou Tarefas.
 * Rola na horizontal em vez de quebrar em duas linhas: nove módulos empilhados
 * empurrariam o conteúdo da página para baixo da dobra.
 *
 * A lista sai da mesma interseção da sidebar (o que existe × o que o papel
 * alcança), então um módulo oculto no desktop não reaparece aqui.
 */

const chip = tv({
  base: "flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[12.5px] font-semibold transition-colors",
  variants: {
    active: {
      true: "bg-gold-grad text-on-primary shadow-glow",
      false:
        "border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-on-surface",
    },
  },
})

export function ObraModuleRail({ obraId }: { obraId: number }) {
  const { t } = useTranslation()
  const { levelOf } = useAccess()
  const { pathname } = useLocation()
  const railRef = useRef<HTMLElement>(null)

  const visible = OBRA_NAV.filter((item) => levelOf(item.module) !== "")

  // Sem isto o módulo aberto pode estar fora da área visível do trilho, e a
  // tela abre sem nenhuma pista de onde o usuário está na lista.
  useEffect(() => {
    railRef.current
      ?.querySelector("[aria-current='page']")
      ?.scrollIntoView({ inline: "center", block: "nearest" })
  }, [pathname])

  return (
    <nav
      ref={railRef}
      // `-mx-4 px-4` sangra até as bordas: o trilho corta na lateral da tela em
      // vez de parar no padding, deixando claro que há mais itens.
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none lg:hidden"
    >
      {visible.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.module}
            to={`/obras/${obraId}/${item.path}`}
            className={({ isActive }) => chip({ active: isActive })}
          >
            <Icon size={14} strokeWidth={1.8} />
            {t(item.labelKey)}
          </NavLink>
        )
      })}
    </nav>
  )
}
