import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Check, Minus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"

import { EtapaStatus } from "@/pages/projetos/types"
import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import type { Project } from "@/shared/types/project"
import { formatCompactCurrency, formatDate } from "@/shared/utils/formatters"
import { daysLate, deriveStatus } from "@/shared/utils/status"

import { useBudget } from "../hooks/useBudget"
import { useStagesList } from "../hooks/useStages"
import { getEquipeMembers } from "../services/equipes.service"
import type { Stage } from "../services/stages.service"
import { calculatePercent } from "../utils/budgetMath"
import { FotosRecentes } from "./FotosRecentes"

/**
 * Visão geral da obra — raio-x e porta de entrada do nível 2 (Telas §10).
 *
 * Três blocos: as **metas** no topo (prazo, etapa atual, executado), o **ciclo
 * da obra** como timeline vertical — a peça central da tela — e os resumos
 * laterais de orçamento e equipe, cada um com atalho para o módulo cheio.
 *
 * Andamento por etapa é aproximado pelo status (0/50/100), que é o que o
 * backend permite hoje: não há percentual executado por etapa.
 */

const STAGE_PROGRESS: Record<EtapaStatus, number> = {
  [EtapaStatus.PLANNED]: 0,
  [EtapaStatus.IN_PROGRESS]: 50,
  [EtapaStatus.BLOCKED]: 0,
  [EtapaStatus.DONE]: 100,
}

const NO_DATE = "—"

function averageProgress(stages: Stage[]): number {
  if (stages.length === 0) return 0
  return Math.round(stages.reduce((acc, s) => acc + STAGE_PROGRESS[s.status], 0) / stages.length)
}

/** Etapa atual = a primeira em andamento; se não houver, a primeira não concluída. */
function currentStage(stages: Stage[]): Stage | null {
  return (
    stages.find((s) => s.status === EtapaStatus.IN_PROGRESS) ??
    stages.find((s) => s.status !== EtapaStatus.DONE) ??
    null
  )
}

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ percent }: { percent: number }) {
  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        <circle
          cx="65"
          cy="65"
          r={RING_RADIUS}
          strokeWidth="10"
          fill="none"
          stroke="var(--color-surface-container-highest)"
        />
        <circle
          cx="65"
          cy="65"
          r={RING_RADIUS}
          strokeWidth="10"
          fill="none"
          stroke="var(--pk-b1)"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <Num className="absolute text-2xl font-bold text-on-surface">{percent}%</Num>
    </div>
  )
}

/** Meta do hero: rótulo em caps, valor em mono, tom de perigo quando desviado. */
function Meta({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-on-surface-faint">
        {label}
      </div>
      <Num
        className={`mt-1.5 block text-[15px] font-bold ${tone === "danger" ? "text-danger" : "text-on-surface"}`}
      >
        {value}
      </Num>
    </div>
  )
}

const node = tv({
  base: "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
  variants: {
    state: {
      done: "bg-ok text-on-primary",
      progress: "bg-gold text-on-primary",
      late: "bg-danger-solid text-white",
      paused: "bg-warn text-on-primary",
      idle: "border border-dashed border-outline bg-surface-container-low text-on-surface-faint",
    },
  },
})

/** Um nó do ciclo da obra. O ícone reforça o status para além da cor. */
function CicloNode({ stage, isLast }: { stage: Stage; isLast: boolean }) {
  const { t } = useTranslation()
  const { state } = deriveStatus({ status: stage.status, plannedEndDate: stage.plannedEndDate })
  const late = daysLate(stage.status === EtapaStatus.DONE ? null : stage.plannedEndDate)
  const progress = STAGE_PROGRESS[stage.status]

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {!isLast && <span className="absolute left-[13px] top-7 h-full w-px bg-outline-variant" />}

      <span className={node({ state })}>
        {state === "done" ? (
          <Check size={14} strokeWidth={2.4} />
        ) : state === "late" ? (
          <AlertTriangle size={13} strokeWidth={2.2} />
        ) : (
          <Minus size={13} strokeWidth={2.2} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13.5px] font-semibold text-on-surface">{stage.name}</span>
          <StatusBadge status={stage.status} plannedEndDate={stage.plannedEndDate} />
        </div>

        <Num className="mt-1 block text-[11px] text-on-surface-variant">
          {stage.plannedStartDate ? formatDate(stage.plannedStartDate) : NO_DATE}
          {" → "}
          {stage.plannedEndDate ? formatDate(stage.plannedEndDate) : NO_DATE}
        </Num>

        <div className="mt-2 flex items-center gap-2.5">
          <Progress
            value={progress}
            height={6}
            tone={state === "late" ? "danger" : state === "done" ? "ok" : "gold"}
            label={stage.name}
          />
          <Num className="w-9 shrink-0 text-right text-[11px] font-semibold text-on-surface-variant">
            {progress}%
          </Num>
        </div>

        {late > 0 && (
          <p className="mt-1.5 text-[10.5px] font-semibold text-danger">
            {t("obra.visaoGeral.lateBy", { count: late })}
          </p>
        )}
      </div>
    </li>
  )
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-on-surface">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function ModuleLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-[12px] font-semibold text-gold-bright hover:underline">
      {children} ›
    </Link>
  )
}

interface VisaoGeralProps {
  project: Project
}

export function VisaoGeral({ project }: VisaoGeralProps) {
  const { t } = useTranslation()
  const { stages } = useStagesList(project.id)
  const { budget } = useBudget(project.id)

  const membersQuery = useQuery({
    queryKey: ["equipes", project.id],
    queryFn: () => getEquipeMembers(project.id),
  })

  const ordered = [...stages].sort((a, b) => a.displayOrder - b.displayOrder)
  const progress = averageProgress(stages)
  const atual = currentStage(ordered)
  const projectLate = daysLate(project.plannedEndDate)

  const spentPercent = budget ? calculatePercent(budget.totalSpent, budget.plannedTotal) : 0

  return (
    <div className="flex flex-col gap-5 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        {/* Metas + ring: prazo, etapa atual e executado sempre à vista. */}
        <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-3">
              <Meta
                label={t("obra.visaoGeral.deadline")}
                value={project.plannedEndDate ? formatDate(project.plannedEndDate) : NO_DATE}
                tone={projectLate > 0 ? "danger" : "default"}
              />
              <Meta
                label={t("obra.visaoGeral.currentStage")}
                value={atual?.name ?? NO_DATE}
              />
              <Meta
                label={t("obra.visaoGeral.executed")}
                value={budget ? formatCompactCurrency(budget.totalSpent) : NO_DATE}
                tone={budget?.exceeded ? "danger" : "default"}
              />
              <Meta
                label={t("obra.visaoGeral.stagesDone")}
                value={`${stages.filter((s) => s.status === EtapaStatus.DONE).length}/${stages.length}`}
              />
              <Meta
                label={t("obra.visaoGeral.builtArea")}
                value={`${project.builtArea} m²`}
              />
              <Meta
                label={t("obra.visaoGeral.team")}
                value={String(membersQuery.data?.length ?? 0)}
              />
            </div>

            <div className="flex shrink-0 justify-center sm:pl-4">
              <ProgressRing percent={progress} />
            </div>
          </div>
        </section>

        <SectionCard
          title={t("obra.visaoGeral.cycle")}
          action={<ModuleLink to={`/obras/${project.id}/etapas`}>{t("obra.visaoGeral.manageStages")}</ModuleLink>}
        >
          {ordered.length === 0 ? (
            <p className="py-8 text-center text-sm text-on-surface-variant">{t("obra.etapas.empty")}</p>
          ) : (
            <ol>
              {ordered.map((stage, idx) => (
                <CicloNode key={stage.id} stage={stage} isLast={idx === ordered.length - 1} />
              ))}
            </ol>
          )}
        </SectionCard>

        <FotosRecentes projectId={project.id} />
      </div>

      <div className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
        <SectionCard
          title={t("obra.visaoGeral.budget")}
          action={<ModuleLink to={`/obras/${project.id}/orcamento`}>{t("obra.visaoGeral.seeExpenses")}</ModuleLink>}
        >
          {!budget ? (
            <p className="text-sm text-on-surface-variant">{t("obra.visaoGeral.noBudget")}</p>
          ) : (
            <div className="space-y-3.5">
              <div className="flex items-baseline justify-between gap-2">
                <Num className="text-xl font-bold text-on-surface">
                  {formatCompactCurrency(budget.totalSpent)}
                </Num>
                <Num className="text-[11.5px] text-on-surface-variant">
                  {t("obra.visaoGeral.ofPlanned", {
                    planned: formatCompactCurrency(budget.plannedTotal),
                  })}
                </Num>
              </div>

              <Progress
                value={spentPercent}
                tone={budget.exceeded ? "danger" : "gold"}
                label={t("obra.visaoGeral.budget")}
              />

              <ul className="space-y-2 pt-1">
                {budget.items.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="min-w-0 truncate text-on-surface-variant">{item.category}</span>
                    <Num
                      className={`shrink-0 font-semibold ${item.exceeded ? "text-danger" : "text-on-surface"}`}
                    >
                      {item.exceeded && "⚠ "}
                      {formatCompactCurrency(item.totalSpent)}
                    </Num>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t("obra.visaoGeral.allocatedTeams")}
          action={<ModuleLink to={`/obras/${project.id}/equipes`}>{t("obra.visaoGeral.seeTeams")}</ModuleLink>}
        >
          {membersQuery.data?.length === 0 ? (
            <p className="text-sm text-on-surface-variant">{t("obra.visaoGeral.noTeam")}</p>
          ) : (
            <ul className="space-y-2.5">
              {membersQuery.data?.slice(0, 6).map((member) => (
                <li key={member.id} className="flex items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-outline bg-surface-container-high text-[10px] font-bold text-on-surface-variant">
                    {member.user.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-on-surface">
                    {member.user.name}
                  </span>
                  <RoleChip role={member.roleInProject} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
