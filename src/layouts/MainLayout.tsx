import { Outlet } from "react-router-dom"
import { Sidebar } from "@/shared/components/sidebar/Sidebar"
import { Header } from "@/shared/components/header/Header"

export function MainLayout() {
	return (
		<div className="flex h-screen overflow-hidden bg-surface">
			<Sidebar />

			<div className="flex flex-1 flex-col overflow-hidden">
				<Header />

				<main className="flex-1 overflow-y-auto p-10">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
