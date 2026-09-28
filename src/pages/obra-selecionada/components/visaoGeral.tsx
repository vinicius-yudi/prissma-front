import { AlertTriangle, Check, Minus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { tv } from "tailwind-variants"

import { DeleteProjectModal } from "@/pages/projetos/components/DeleteProjectModal"
import { ProjectStepModal } from "@/pages/projetos/components/ProjectStepModal"
import { EtapaStatus } from "@/pages/projetos/types"
import { Button } from "@/shared/components/ui/button/Button"
import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatProjectAddress, type Project } from "@/shared/types/project"
import { formatCompactCurrency, formatDate } from "@/shared/utils/formatters"
import { daysLate, deriveStatus } from "@/shared/utils/status"

import { useObraResumo } from "../hooks/useObraResumo"
import { useProjectPermissions } from "../hooks/useProjectPermissions"
import { ProjectPermission } from "../services/projectPermissions.service"
import type { Stage } from "../services/stages.service"
import { stageProgress } from "../utils/stageProgress"
import { DocumentosRecentes } from "./DocumentosRecentes"

/**
 * Visão geral da obra — raio-x e porta de entrada do nível 2 (Telas §10).
 *
 * Quatro blocos: o **hero** com as metas e o anel de andamento, o **ciclo da
 * obra** como timeline vertical — a peça central da tela —, os resumos
 * laterais de orçamento e equipe, e os documentos recentes. Cada resumo leva ao
 * módulo cheio; nenhum deles edita.
 *
 * Editar e excluir a obra vivem aqui, e não no cabeçalho do <ObraLayout>: lá
 * apareceriam em todos os módulos. São `outline` e `destructive` de propósito —
 * o gradiente ouro fica reservado às ações de criação dos módulos.
 *
 * Andamento por etapa é aproximado pelo status (0/50/100), que é o que o
 * backend permite hoje: não há percentual executado por etapa.
 */

const NO_DATE = "—"

const metaValue = tv({
  base: "mt-1.5 block text-[18px] font-bold leading-tight",
  variants: {
    tone: {
      default: "text-on-surface",
      danger: "text-danger",
    },
  },
})

const categoryValue = tv({
  base: "shrink-0 font-semibold",
  variants: {
    exceeded: {
      true: "text-danger",
      false: "text-on-surface",
    },
  },
})

const RING_SIZE = 152
const RING_RADIUS = 66
const RING_STROKE = 13
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ percent }: { percent: number }) {
  const { t } = useTranslation()
  const center = RING_SIZE / 2

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          strokeWidth={RING_STROKE}
          fill="none"
          stroke="var(--color-surface-container-highest)"
        />
        <circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          strokeWidth={RING_STROKE}
          fill="none"
          stroke="var(--pk-b1)"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Num className="text-[30px] font-bold leading-none tracking-tight text-on-surface">
          {percent}%
        </Num>
        <span className="mt-1 text-[11px] text-on-surface-faint">
          {t("obra.visaoGeral.completedLabel")}
        </span>
      </div>
    </div>
  )
}

/** Meta do hero: rótulo em caps, valor em mono e uma linha de leitura embaixo. */
function Meta({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "danger"
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-on-surface-faint">
        {label}
      </div>
      <Num className={metaValue({ tone })}>
        <span className="block truncate">{value}</span>
      </Num>
      {hint && <div className="mt-1 truncate text-[11px] text-on-surface-faint">{hint}</div>}
    </div>
  )
}

const node = tv({
  base: "relative z-10 flex size-[26px] shrink-0 items-center justify-center rounded-full",
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
  const progress = stageProgress(stage)

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {!isLast && <span className="absolute left-[12.5px] top-7 h-full w-px bg-outline-variant" />}

      <span className={node({ state })}>
        {state === "done" ? (
          <Check size={13} strokeWidth={2.6} />
        ) : state === "late" ? (
          <AlertTriangle size={13} strokeWidth={2.2} />
        ) : (
          <Minus size={13} strokeWidth={2.2} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14.5px] font-semibold text-on-surface">{stage.name}</span>
          <StatusBadge status={stage.status} plannedEndDate={stage.plannedEndDate} />
          {/* O intervalo fecha a linha à direita, como cota de prazo. */}
          <Num className="ml-auto shrink-0 text-[11.5px] text-on-surface-faint">
            {stage.plannedStartDate ? formatDate(stage.plannedStartDate) : NO_DATE}
            {" – "}
            {stage.plannedEndDate ? formatDate(stage.plannedEndDate) : NO_DATE}
          </Num>
        </div>

        <div className="mt-2.5 flex items-center gap-3">
          <Progress
            value={progress}
            height={6}
            tone={state === "late" ? "danger" : state === "done" ? "ok" : "gold"}
            label={stage.name}
          />
          <Num
            className={`w-9 shrink-0 text-right text-[11.5px] font-semibold ${
              late > 0 ? "text-danger" : "text-on-surface-variant"
            }`}
          >
            {progress}%
          </Num>
        </div>

        {late > 0 && (
          <p className="mt-2 text-[11px] font-semibold text-danger">
            ⚠ {t("obra.visaoGeral.lateBy", { count: late })}
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
    <Link
      to={to}
      className="shrink-0 whitespace-nowrap text-[12px] font-semibold text-gold-bright hover:underline"
    >
      {children} ›
    </Link>
  )
}

interface VisaoGeralProps {
  project: Project
}

export function VisaoGeral({ project }: VisaoGeralProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Editar e excluir a obra exigem MANAGE_PROJECT no backend. Sem este gate os
  // botões apareciam para todo membro — inclusive para o cliente, que só
  // acompanha — e a ação morria num toast de 403.
  const { can } = useProjectPermissions(project.id)
  const canManageProject = can(ProjectPermission.MANAGE_PROJECT)

  const resumo = useObraResumo({
    projectId: project.id,
    plannedEndDate: project.plannedEndDate,
  })
  const { stages: ordered, progress, atual, projectLate, budget, spentPercent } = resumo

  const stageIndex = atual ? ordered.findIndex((s) => s.id === atual.id) + 1 : 0

  return (
    <div className="flex flex-col gap-5">
      {/* HERO — identidade da obra, metas e andamento. O nome e o status não se
          repetem aqui: já são o H1 e o badge do cabeçalho da página. */}
      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5 sm:p-6">
        <p className="text-[13px] text-on-surface-variant">
          {formatProjectAddress(project)} · {project.builtArea} m²
        </p>

        <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="order-2 grid flex-1 grid-cols-2 gap-x-6 gap-y-5 sm:order-1 lg:grid-cols-4">
            <Meta
              label={t("obra.visaoGeral.deadline")}
              value={project.plannedEndDate ? formatDate(project.plannedEndDate) : NO_DATE}
              hint={
                projectLate > 0 ? t("obra.visaoGeral.deadlineDeviation", { count: projectLate }) : undefined
              }
              tone={projectLate > 0 ? "danger" : "default"}
            />
            <Meta
              label={t("obra.visaoGeral.currentStage")}
              value={atual?.name ?? NO_DATE}
              hint={
                atual ? t("obra.visaoGeral.stageOf", { index: stageIndex, total: ordered.length }) : undefined
              }
            />
            <Meta
              label={t("obra.visaoGeral.executed")}
              value={budget ? formatCompactCurrency(budget.totalSpent) : NO_DATE}
              hint={budget ? t("obra.visaoGeral.ofBudget", { percent: spentPercent }) : undefined}
              tone={budget?.exceeded ? "danger" : "default"}
            />
            <Meta
              label={t("obra.visaoGeral.team")}
              value={String(resumo.membersCount)}
              hint={t("obra.visaoGeral.headcount", { count: resumo.membersCount })}
            />
          </div>

          {/* No celular o anel vem primeiro: é a resposta mais rápida à
              pergunta "como está a obra". */}
          <div className="order-1 flex shrink-0 flex-col items-center gap-4 sm:order-2 sm:pl-4">
            <ProgressRing percent={progress} />

            {canManageProject && (
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setDeleteOpen(true)}
                >
                  {t("obra.delete")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setEditOpen(true)}
                >
                  {t("obra.edit")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <SectionCard
            title={t("obra.visaoGeral.cycle")}
            action={
              <ModuleLink to={`/obras/${project.id}/etapas`}>
                {t("obra.visaoGeral.manageStages")}
              </ModuleLink>
            }
          >
            {ordered.length === 0 ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                {t("obra.etapas.empty")}
              </p>
            ) : (
              <ol>
                {ordered.map((stage, idx) => (
                  <CicloNode key={stage.id} stage={stage} isLast={idx === ordered.length - 1} />
                ))}
              </ol>
            )}
          </SectionCard>

          <SectionCard
            title={t("obra.visaoGeral.recentDocs")}
            action={
              <ModuleLink to={`/obras/${project.id}/documentos`}>
                {t("obra.visaoGeral.seeAllDocs")}
              </ModuleLink>
            }
          >
            <DocumentosRecentes projectId={project.id} />
          </SectionCard>
        </div>

        <div className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
          <SectionCard
            title={t("obra.visaoGeral.budget")}
            action={
              <ModuleLink to={`/obras/${project.id}/orcamento`}>
                {t("obra.visaoGeral.seeExpenses")}
              </ModuleLink>
            }
          >
            {!budget ? (
              <p className="text-sm text-on-surface-variant">{t("obra.visaoGeral.noBudget")}</p>
            ) : (
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <Num className="text-[26px] font-bold leading-none tracking-tight text-on-surface">
                    {formatCompactCurrency(budget.totalSpent)}
                  </Num>
                  <Num className="text-[11.5px] text-on-surface-faint">
                    {t("obra.visaoGeral.ofPlanned", {
                      planned: formatCompactCurrency(budget.plannedTotal),
                    })}
                  </Num>
                </div>

                <Progress
                  value={spentPercent}
                  height={10}
                  tone={budget.exceeded ? "danger" : "gold"}
                  label={t("obra.visaoGeral.budget")}
                />

                <ul className="space-y-2.5 pt-1">
                  {budget.items.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-[12.5px]">
                      <span
                        className={`size-2 shrink-0 rounded-full ${
                          item.exceeded ? "bg-danger-solid" : "bg-gold"
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-on-surface-variant">
                        {item.category}
                      </span>
                      <Num className={categoryValue({ exceeded: item.exceeded })}>
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
            action={
              <ModuleLink to={`/obras/${project.id}/equipes`}>
                {t("obra.visaoGeral.seeTeams")}
              </ModuleLink>
            }
          >
            {resumo.membersCount === 0 ? (
              <p className="text-sm text-on-surface-variant">{t("obra.visaoGeral.noTeam")}</p>
            ) : (
              <ul className="space-y-3">
                {resumo.members?.slice(0, 6).map((member) => (
                  <li key={member.id} className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-outline bg-surface-container-high text-[10px] font-bold text-on-surface-variant">
                      {member.user.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-on-surface">
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

      <ProjectStepModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <DeleteProjectModal
        project={deleteOpen ? project : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate("/obras")}
      />
    </div>
  )
}
