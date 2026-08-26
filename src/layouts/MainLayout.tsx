import { Outlet, useLocation } from "react-router-dom"

import { Header } from "@/shared/components/header/Header"
import { BottomTabBar } from "@/shared/components/mobile/BottomTabBar"
import { Sidebar } from "@/shared/components/sidebar/Sidebar"
import { PageChromeProvider } from "@/shared/components/ui/page-chrome/PageChrome"
import { PrimaryActionProvider } from "@/shared/components/ui/page-chrome/PrimaryActionProvider"

/**
 * Shell autenticado.
 *
 * Duas navegações que não coexistem: sidebar a partir de `lg`, barra de abas
 * com FAB abaixo disso (Fluxos v2 §9). A gaveta que a sidebar era no celular
 * saiu — com abas fixas e o trilho de módulos da obra não sobrou nada para ela
 * fazer, e um menu escondido atrás de hambúrguer é pior que abas visíveis.
 *
 * `h-dvh` e não `h-screen`: no celular a barra de endereço do navegador retrai,
 * e com `100vh` o rodapé ficava embaixo dela.
 */
export function MainLayout() {
	const { pathname } = useLocation()

	return (
		<div className="flex h-dvh overflow-hidden bg-background">
			<PrimaryActionProvider>
				<Sidebar />

				<div className="flex flex-1 flex-col overflow-hidden">
					<Header />
					{/* `pb-6` extra no celular para a última linha não ficar sob o FAB,
					    que sobe acima da barra de abas. */}
					<main className="flex-1 overflow-y-auto p-4 pb-6 sm:p-6 lg:p-8">
						{/*
						  A chave por rota reinicia a contagem dos slots únicos por tela
						  (linha de cota, card de contraste, botão primário) a cada
						  navegação — sem isso a guarda acusaria duplicata falsa ao trocar
						  de módulo.
						*/}
						<PageChromeProvider key={pathname}>
							<Outlet />
						</PageChromeProvider>
					</main>

					<BottomTabBar />
				</div>
			</PrimaryActionProvider>
		</div>
	)
}
