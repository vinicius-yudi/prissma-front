import { Menu } from "lucide-react"

import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"

interface HeaderProps {
	onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
	return (
		<header className="flex h-16 items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-4 lg:px-6">
			<button
				type="button"
				onClick={onMenuClick}
				className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer lg:hidden"
				aria-label="Abrir menu"
			>
				<Menu className="h-5 w-5" />
			</button>

			<div className="ml-auto">
				<ThemeToggle />
			</div>
		</header>
	)
}
