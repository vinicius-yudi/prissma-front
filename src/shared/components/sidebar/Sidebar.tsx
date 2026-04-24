import { NavLink, useLocation } from "react-router-dom"
import {
	BarChart3,
	ClipboardList,
	FolderKanban,
	Home,
	LogOut,
	Settings,
	Users,
	X,
} from "lucide-react"
import { tv } from "tailwind-variants"
import logo from "@/assets/svg/logo.svg"
import { useAuth } from "@/contexts/AuthContext"

const navItems = [
	{ to: "/dashboard", label: "Início", icon: Home },
	{ to: "/projetos", label: "Projetos", icon: FolderKanban },
	{ to: "/tarefas", label: "Tarefas", icon: ClipboardList },
	{ to: "/equipe", label: "Equipe", icon: Users },
	{ to: "/relatorios", label: "Relatórios", icon: BarChart3 },
	{ to: "/configuracoes", label: "Configurações", icon: Settings },
] as const

const aside = tv({
	base: "fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-col bg-surface-container-low border-r border-outline-variant transition-transform duration-300 ease-in-out lg:relative lg:w-60 lg:translate-x-0",
	variants: {
		open: {
			true: "translate-x-0",
			false: "-translate-x-full",
		},
	},
})

const navLink = tv({
	base: "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
	variants: {
		active: {
			true: "bg-primary-container text-on-primary-container",
			false: "text-on-surface-variant hover:bg-surface-container-high",
		},
	},
})

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const { logout } = useAuth()
	const location = useLocation()

	return (
		<aside className={aside({ open: isOpen })}>
			<div className="flex items-center justify-between px-6 py-5">
				<div className="flex items-center gap-2">
					<img src={logo} alt="Prissma" className="h-10" />
				</div>
				<button
					type="button"
					onClick={onClose}
					className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer lg:hidden"
				>
					<X className="h-5 w-5" />
				</button>
			</div>

			<nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
				{navItems.map(({ to, label, icon: Icon }) => {
					const isActive = location.pathname === to

					return (
						<NavLink
							key={to}
							to={to}
							onClick={onClose}
							className={navLink({ active: isActive })}
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
