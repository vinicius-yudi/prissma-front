import { motion } from "motion/react"
import { Outlet, useLocation } from "react-router-dom"

import { CommandPaletteProvider } from "@/shared/components/command-palette/CommandPaletteProvider"
import { MobileActionButton } from "@/shared/components/mobile/MobileActionButton"
import { MobileNav } from "@/shared/components/mobile/MobileNav"
import { Sidebar } from "@/shared/components/sidebar/Sidebar"
import { Topbar } from "@/shared/components/topbar/Topbar"
import { PageChromeProvider } from "@/shared/components/ui/page-chrome/PageChrome"
import { PrimaryActionProvider } from "@/shared/components/ui/page-chrome/PrimaryActionProvider"
import { EASE_OUT_EXPO } from "@/shared/constants/motion"

/** `/obras/12/tarefas` → `/obras/12`: trocar de aba da obra não refaz a entrada. */
function sectionOf(pathname: string): string {
  return pathname.split("/").slice(0, 3).join("/")
}

/**
 * Shell autenticado (DS v2, Layout).
 *
 * Sidebar a partir de `lg`; abaixo disso, navegação inferior. A barra superior
 * vive dentro da área que rola, fixa no topo, para o conteúdo passar por baixo
 * do blur. Conteúdo até 1320px com margens de 16/24/32px.
 *
 * `h-dvh` e não `h-screen`: no celular a barra de endereço retrai, e com
 * `100vh` o rodapé ficava embaixo dela.
 */
export function MainLayout() {
  const { pathname } = useLocation()
  const section = sectionOf(pathname)

  return (
    <CommandPaletteProvider>
      <PrimaryActionProvider>
        <div className="flex h-dvh overflow-hidden bg-bg">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto" data-scroll-root>
              <Topbar />
              {/* `pb-24` no celular: a ação flutuante não cobre a última linha. */}
              <main className="px-4 pt-6 pb-24 sm:px-6 lg:px-8 lg:pb-12">
                <motion.div
                  key={section}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                  className="mx-auto max-w-[1320px]"
                >
                  {/* A chave por rota reinicia a contagem dos slots únicos por
                      tela (linha de cota, botão primário) a cada navegação. */}
                  <PageChromeProvider key={pathname}>
                    <Outlet />
                  </PageChromeProvider>
                </motion.div>
              </main>
            </div>

            <MobileNav />
          </div>
        </div>
        <MobileActionButton />
      </PrimaryActionProvider>
    </CommandPaletteProvider>
  )
}
