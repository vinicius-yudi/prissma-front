import { FolderKanban, ClipboardCheck, CalendarDays } from "lucide-react"

const statsCards = [
	{
		icon: FolderKanban,
		label: "PROJETOS ATIVOS",
		value: 8,
		detail: "+2 este mês",
		accent: "border-t-primary bg-primary/5",
		iconBg: "bg-primary/15 text-primary",
		valueColor: "text-primary",
	},
	{
		icon: ClipboardCheck,
		label: "TAREFAS PENDENTES",
		value: 14,
		detail: "5 com prazo hoje",
		accent: "border-t-secondary bg-secondary/5",
		iconBg: "bg-secondary/15 text-secondary",
		valueColor: "text-secondary",
	},
	{
		icon: CalendarDays,
		label: "PRÓXIMAS VISITAS",
		value: 3,
		detail: "Próxima: amanhã",
		accent: "border-t-tertiary bg-tertiary/5",
		iconBg: "bg-tertiary/15 text-tertiary",
		valueColor: "text-tertiary",
	},
] as const

export function DashboardPage() {
	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-on-surface">
					Painel de Controle
				</h1>
				<p className="text-sm text-on-surface-variant">
					Gerencie seus projetos e acompanhe o progresso
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{statsCards.map((card) => {
					const Icon = card.icon

					return (
						<div
							key={card.label}
							className={`rounded-xl border border-outline-variant border-t-3 p-5 ${card.accent}`}
						>
							<div className="flex items-start justify-between">
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}
								>
									<Icon className="h-5 w-5" />
								</div>
							</div>

							<p className="mt-3 text-xs font-semibold tracking-wider text-on-surface-variant">
								{card.label}
							</p>
							<p className={`mt-1 text-3xl font-bold ${card.valueColor}`}>
								{card.value}
							</p>
							<p className="mt-1 text-xs text-on-surface-variant">
								{card.detail}
							</p>
						</div>
					)
				})}
			</div>
		</div>
	)
}
