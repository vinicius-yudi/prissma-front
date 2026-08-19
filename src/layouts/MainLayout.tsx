import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/shared/components/sidebar/Sidebar"
import { Header } from "@/shared/components/header/Header"

export function MainLayout() {
	const [sidebarOpen, setSidebarOpen] = useState(false)

	return (
		<div className="flex h-screen overflow-hidden bg-surface">
			<Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

			{sidebarOpen && (
				<div
					className="fixed inset-0 z-20 bg-black/50 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<div className="flex flex-1 flex-col overflow-hidden">
				<Header onMenuClick={() => setSidebarOpen(true)} />
				<main className={"flex-1 overflow-y-auto p-6 lg:p-8"}>
					<Outlet />
				</main>
			</div>
		</div>
	)
}
