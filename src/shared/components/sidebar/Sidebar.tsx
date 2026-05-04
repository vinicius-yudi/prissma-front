import { NavLink, useLocation } from "react-router-dom"
import {
	BarChart3,
	ChevronDown,
	ClipboardList,
	FolderKanban,
	Home,
	LogOut,
	Settings,
	UserCircle,
	Users,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"
import { useAuth } from "@/contexts/AuthContext"
import { getMyProfile } from "@/shared/services/user.service"
import { DeleteAccountModal } from "@/pages/perfil/components/DeleteAccountModal"
import { PerfilModal } from "@/pages/perfil/components/PerfilModal"

const NAV_ITEMS = [
	{ to: "/dashboard", key: "sidebar.nav.home", icon: Home },
	{ to: "/projetos", key: "sidebar.nav.projects", icon: FolderKanban },
	{ to: "/tarefas", key: "sidebar.nav.tasks", icon: ClipboardList },
	{ to: "/equipe", key: "sidebar.nav.team", icon: Users },
	{ to: "/relatorios", key: "sidebar.nav.reports", icon: BarChart3 },
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

const chevronIcon = tv({
	base: "h-4 w-4 shrink-0 transition-transform duration-200",
	variants: {
		open: {
			true: "rotate-180",
			false: "",
		},
	},
})

const menuItemBase = tv({
	base: "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
	variants: {
		variant: {
			default: "text-on-surface-variant hover:bg-surface-container-high cursor-pointer",
			danger: "text-error hover:bg-error/10 cursor-pointer",
			disabled: "text-on-surface-variant/40 cursor-not-allowed",
		},
	},
})

interface SidebarProps {
	isOpen: boolean
	onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
	const { logout } = useAuth()
	const { t } = useTranslation()
	const location = useLocation()
	const [menuOpen, setMenuOpen] = useState(false)
	const [perfilOpen, setPerfilOpen] = useState(false)
	const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	const { data: profile } = useQuery({
		queryKey: ["profile"],
		queryFn: getMyProfile,
	})

	const initial = profile?.name?.[0]?.toUpperCase() ?? "U"
	const displayName = profile?.name ?? t("sidebar.user")

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => document.removeEventListener("mousedown", handleClickOutside)
	}, [])

	function toggleMenu() {
		setMenuOpen((prev) => !prev)
	}

	function handleLogout() {
		setMenuOpen(false)
		logout()
	}

	return (
		<aside className={aside({ open: isOpen })}>
			<div ref={menuRef} className="relative border-b border-outline-variant px-3 py-1">

				<button
					type="button"
					onClick={toggleMenu}
					className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
				>
					<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container text-sm font-bold text-on-primary-container">
						{initial}
					</div>
					<div className="min-w-0 flex-1 overflow-hidden">
						<div className="flex min-w-0 items-center justify-between gap-1">
							<span className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">
								{displayName}
							</span>
							<ChevronDown
								className={chevronIcon({ open: menuOpen })}
								aria-hidden
							/>
						</div>
						<p className="text-xs text-on-surface-variant">{t("sidebar.accountType")}</p>
					</div>
				</button>

				{menuOpen && (
					<div className="absolute top-full left-3 right-3 mt-1 rounded-xl border border-outline-variant bg-surface-container py-1 shadow-lg z-10">
						<button
							type="button"
							onClick={() => { setPerfilOpen(true); setMenuOpen(false) }}
							className={menuItemBase({ variant: "default" })}
						>
							<UserCircle className="h-5 w-5" />
							{t("sidebar.menu.profile")}
						</button>
						<button
							type="button"
							disabled
							className={menuItemBase({ variant: "disabled" })}
						>
							<Settings className="h-5 w-5" />
							{t("sidebar.menu.settings")}
						</button>
						<button
							type="button"
							onClick={handleLogout}
							className={menuItemBase({ variant: "danger" })}
						>
							<LogOut className="h-5 w-5" />
							{t("sidebar.menu.logout")}
						</button>
					</div>
				)}
			</div>

			<PerfilModal
				open={perfilOpen}
				onClose={() => setPerfilOpen(false)}
				onDeleteAccount={() => { setPerfilOpen(false); setDeleteAccountOpen(true) }}
			/>
			<DeleteAccountModal open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)} />

			<nav className="flex-1 flex flex-col gap-1 px-3 py-2">
				{NAV_ITEMS.map(({ to, key, icon: Icon }) => {
					const isActive = location.pathname === to

					return (
						<NavLink
							key={to}
							to={to}
							onClick={onClose}
							className={navLink({ active: isActive })}
						>
							<Icon className="h-5 w-5" />
							{t(key)}
						</NavLink>
					)
				})}
			</nav>
		</aside>
	)
}
