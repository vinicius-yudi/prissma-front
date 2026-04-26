import { useTranslation } from "react-i18next"
import { PerfilForm } from "./components/PerfilForm"

export function PerfilPage() {
	const { t } = useTranslation()

	return (
		<div className="max-w-xl">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-on-surface">{t("profile.title")}</h1>
				<p className="text-sm text-on-surface-variant">{t("profile.subtitle")}</p>
			</div>

			<div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 lg:p-8">
				<PerfilForm />
			</div>
		</div>
	)
}
