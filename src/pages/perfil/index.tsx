import { PerfilForm } from "./components/PerfilForm"

const LABELS = {
	title: "Edição de Perfil",
	subtitle: "Atualize suas informações pessoais.",
} as const

export function PerfilPage() {
	return (
		<div className="max-w-xl">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-on-surface">{LABELS.title}</h1>
				<p className="text-sm text-on-surface-variant">{LABELS.subtitle}</p>
			</div>

			<div className="rounded-xl border border-outline-variant bg-surface-container-low p-6 lg:p-8">
				<PerfilForm />
			</div>
		</div>
	)
}
