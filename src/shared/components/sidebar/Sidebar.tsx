import { NavLink, useLocation } from "react-router-dom"
import {
	Home,
	FolderKanban,
	ClipboardList,
	Users,
	BarChart3,
	Settings,
	LogOut,
	Monitor,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
	{ to: "/dashboard", label: "Início", icon: Home },
	{ to: "/projetos", label: "Projetos", icon: FolderKanban },
	{ to: "/tarefas", label: "Tarefas", icon: ClipboardList },
	{ to: "/equipe", label: "Equipe", icon: Users },
	{ to: "/relatorios", label: "Relatórios", icon: BarChart3 },
	{ to: "/configuracoes", label: "Configurações", icon: Settings },
] as const

export function Sidebar() {
	const { logout } = useAuth()
	const location = useLocation()

	return (
		<aside className="flex h-screen w-60 flex-col bg-surface-container-low border-r border-outline-variant">
			<div className="flex items-center gap-2 px-6 py-5">
				<Monitor className="h-6 w-6 text-primary" />
				<span className="text-lg font-bold text-on-surface">Prissma</span>
			</div>

			<nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
				{navItems.map(({ to, label, icon: Icon }) => {
					const isActive = location.pathname === to

					return (
						<NavLink
							key={to}
							to={to}
							className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
								isActive
									? "bg-primary-container text-on-primary-container"
									: "text-on-surface-variant hover:bg-surface-container-high"
							}`}
						>
							<Icon className="h-5 w-5" />
							{label}
						</NavLink>
					)
				})}
			</nav>

			<div className="border-t border-outline-variant px-3 py-4">
				<button
					type="button"
					onClick={logout}
					className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-error hover:bg-error/10 transition-colors cursor-pointer"
				>
					<LogOut className="h-5 w-5" />
					Sair
				</button>
			</div>
		</aside>
	)
}
