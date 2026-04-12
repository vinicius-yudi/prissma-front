import { Bell } from "lucide-react"

export function Header() {
	return (
		<header className="flex h-16 items-center justify-end gap-4 border-b border-outline-variant bg-surface-container-low px-6">
			<button
				type="button"
				className="relative rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
			>
				<Bell className="h-5 w-5" />
				<span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-on-error">
					3
				</span>
			</button>

			<div className="flex items-center gap-3">
				<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-on-primary-container">
					U
				</div>
				<div className="flex flex-col">
					<span className="text-sm font-medium text-on-surface">Usuário</span>
					<span className="text-xs text-on-surface-variant">Arquiteto</span>
				</div>
			</div>
		</header>
	)
}
