import { FolderKanban, ClipboardCheck, CalendarDays } from "lucide-react"
import { useTranslation } from "react-i18next"

const STATS_CONFIG = [
	{
		icon: FolderKanban,
		labelKey: "dashboard.stats.activeProjects",
		detailKey: "dashboard.stats.activeProjectsDetail",
		value: 8,
		accent: "border-t-primary bg-primary/5",
		iconBg: "bg-primary/15 text-primary",
		valueColor: "text-primary",
	},
	{
		icon: ClipboardCheck,
		labelKey: "dashboard.stats.pendingTasks",
		detailKey: "dashboard.stats.pendingTasksDetail",
		value: 14,
		accent: "border-t-secondary bg-secondary/5",
		iconBg: "bg-secondary/15 text-secondary",
		valueColor: "text-secondary",
	},
	{
		icon: CalendarDays,
		labelKey: "dashboard.stats.nextVisits",
		detailKey: "dashboard.stats.nextVisitsDetail",
		value: 3,
		accent: "border-t-tertiary bg-tertiary/5",
		iconBg: "bg-tertiary/15 text-tertiary",
		valueColor: "text-tertiary",
	},
] as const

export function DashboardPage() {
	const { t } = useTranslation()

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-on-surface">
					{t("dashboard.title")}
				</h1>
				<p className="text-sm text-on-surface-variant">
					{t("dashboard.subtitle")}
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{STATS_CONFIG.map((card) => {
					const Icon = card.icon

					return (
						<div
							key={card.labelKey}
							className={`rounded-xl border border-outline-variant border-t-3 p-5 ${card.accent}`}
						>
							<div className="flex items-start justify-between">
								<div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.iconBg}`}>
									<Icon className="h-5 w-5" />
								</div>
							</div>

							<p className="mt-3 text-xs font-semibold tracking-wider text-on-surface-variant">
								{t(card.labelKey)}
							</p>
							<p className={`mt-1 text-3xl font-bold ${card.valueColor}`}>
								{card.value}
							</p>
							<p className="mt-1 text-xs text-on-surface-variant">
								{t(card.detailKey)}
							</p>
						</div>
					)
				})}
			</div>
		</div>
	)
}
