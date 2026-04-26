import { Menu } from "lucide-react"
import { useTranslation } from "react-i18next"

import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"

interface HeaderProps {
	onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
	const { t } = useTranslation()

	return (
		<header className="flex h-16 items-center justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-4 lg:px-6">
			<button
				type="button"
				onClick={onMenuClick}
				className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer lg:hidden"
				aria-label={t("header.openMenu")}
			>
				<Menu className="h-5 w-5" />
			</button>

			<div className="ml-auto flex items-center gap-3">
				<LanguageSelect />
				<ThemeToggle />
			</div>
		</header>
	)
}
