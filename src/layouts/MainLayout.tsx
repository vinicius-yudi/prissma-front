import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import { Header } from "@/shared/components/header/Header"
import { Sidebar } from "@/shared/components/sidebar/Sidebar"
import { PageChromeProvider } from "@/shared/components/ui/page-chrome/PageChrome"

export function MainLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const { pathname } = useLocation()

	return (
		<div className="flex h-screen overflow-hidden bg-background">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{sidebarOpen && (
				<div
					className="fixed inset-0 z-20 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<div className="flex flex-1 flex-col overflow-hidden">
				<Header onMenuClick={() => setSidebarOpen(true)} />
				<main className="flex-1 overflow-y-auto p-6 lg:p-8">
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
			</div>
		</div>
	)
}
