import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"

import type { WeekDay } from "../utils/dashboardData"

const day = tv({
  base: "grid grid-cols-[64px_1fr] gap-3 rounded-[10px] px-2 py-2",
  variants: {
    today: { true: "bg-gold-soft/60" },
  },
})

const dayName = tv({
  base: "text-[12px] first-letter:uppercase",
  variants: {
    today: {
      true: "font-[650] text-gold-hi",
      false: "text-meta",
    },
  },
})

const dot = tv({
  base: "size-1.5 flex-none rounded-full",
  variants: {
    urgent: {
      true: "bg-danger",
      false: "bg-gold",
    },
  },
})

/** "Próximos 7 dias": minhas tarefas pelo dia do prazo; hoje em destaque. */
export function WeekAgenda({ week }: { week: WeekDay[] }) {
  const { t, i18n } = useTranslation()

  return (
    <section className="rounded-lg bg-surface p-5 hairline">
      <h2 className="t-section text-ink">{t("dashboard.weekTitle")}</h2>
      <ol className="mt-4 space-y-1">
        {week.map(({ offset, date, tasks }) => {
          const isToday = offset === 0
          return (
            <li key={offset} className={day({ today: isToday })}>
              <div>
                <p className={dayName({ today: isToday })}>
                  {isToday ? t("dashboard.today") : date.toLocaleDateString(i18n.language, { weekday: "short" })}
                </p>
                <p className="t-data text-ink-2">{date.getDate()}</p>
              </div>
              <div className="min-w-0 space-y-1">
                {tasks.length === 0 && <p className="pt-2 text-[12.5px] text-ink-3">—</p>}
                {tasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/obras/${task.projectId}/tarefas`}
                    className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 text-[13px] text-ink transition-colors hover:bg-raised"
                  >
                    <span className={dot({ urgent: task.urgent })} />
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto flex-none truncate text-[11.5px] text-meta">{task.projectTitle}</span>
                  </Link>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
