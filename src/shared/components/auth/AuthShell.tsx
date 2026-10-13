import { motion } from "motion/react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { BrandPanel } from "@/shared/components/brand/BrandPanel"
import { Logo } from "@/shared/components/brand/Logo"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { SPRING_SOFT } from "@/shared/constants/motion"

interface AuthShellProps {
  children: ReactNode
  /**
   * Chave do conteúdo: trocar de passo (tipo de conta → formulário, formulário
   * → e-mail enviado) refaz a entrada.
   */
  step?: string
}

/**
 * Casca das telas públicas (login, cadastro, senha, convite).
 *
 * À esquerda, a marca e o formulário em até 400px; à direita, a partir de
 * `lg`, o painel de marca com a torre em construção. Idioma e tema ficam no
 * topo porque aqui ainda não há sidebar.
 */
export function AuthShell({ children, step = "form" }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between gap-3">
          <Link to="/login" className="flex-none">
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <LanguageSelect />
            <ThemeToggle />
          </div>
        </div>

        <motion.main
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_SOFT}
          className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10"
        >
          {children}
        </motion.main>
      </div>

      <BrandPanel />
    </div>
  )
}
