import type { CSSProperties, ReactNode } from "react"
import { Calendar, Layers, MapPin } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { Etapa, ProjetoAcompanhamento } from "@/pages/projetos/types"
import { formatProjectAddress, type Project } from "@/shared/types/project"

const NO_DATE = "—"
const DATE_SEPARATOR = " → "
const M2 = "m²"

function calcTotalProgress(ac: ProjetoAcompanhamento): number {
  if (ac.totalTarefas === 0) return 0
  return Math.round((ac.tarefasConcluidas / ac.totalTarefas) * 100)
}

function calcEtapasPercent(ac: ProjetoAcompanhamento): number {
  if (ac.totalEtapas === 0) return 0
  return Math.round((ac.etapasConcluidas / ac.totalEtapas) * 100)
}

function calcEtapasEmAndamento(ac: ProjetoAcompanhamento): number {
  return ac.etapas.filter(e => e.status === "IN_PROGRESS").length
}

function calcEtapaProgress(etapa: Etapa): number {
  if (etapa.tasks.length === 0) return 0
  const done = etapa.tasks.filter(t => t.status === "DONE").length
  return Math.round((done / etapa.tasks.length) * 100)
}

function formatDate(d: string | null): string {
  if (!d) return NO_DATE
  return new Date(d).toLocaleDateString("pt-BR")
}

function isPrazoVencido(end: string | null): boolean {
  if (!end) return false
  return new Date(end).getTime() < Date.now()
}

const RING_RADIUS = 52
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

function ProgressRing({ percent }: { percent: number }) {
  const offset = RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE
  const ringStyle: CSSProperties = { strokeDashoffset: offset }
  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130" className="-rotate-90">
        <circle
          cx="65" cy="65" r={RING_RADIUS}
          strokeWidth="10" fill="none"
          stroke="var(--color-surface-container-highest)"
        />
        <circle
          cx="65" cy="65" r={RING_RADIUS}
          strokeWidth="10" fill="none"
          stroke="var(--color-primary)"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeLinecap="round"
          style={ringStyle}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-2xl font-black text-on-surface">{percent}%</span>
    </div>
  )
}

interface InfoCardProps {
  icon: LucideIcon
  label: string
  children: ReactNode
}

function InfoCard({ icon: Icon, label, children }: InfoCardProps) {
  return (
    <div className="bg-surface-container rounded-lg p-4 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium uppercase tracking-wider">
        <Icon size={12} />
        {label}
      </div>
      {children}
    </div>
  )
}

function PrazoContent({ start, end }: { start: string | null; end: string | null }) {
  const { t } = useTranslation()
  if (isPrazoVencido(end)) {
    return <p className="text-sm font-semibold text-error">{t("obra.visaoGeral.deadlineOverdue")}</p>
  }
  return (
    <p className="text-sm text-on-surface">
      {formatDate(start)}{DATE_SEPARATOR}{formatDate(end)}
    </p>
  )
}

function EtapaRow({ etapa }: { etapa: Etapa }) {
  const progress = calcEtapaProgress(etapa)
  const barStyle: CSSProperties = { width: `${progress}%` }
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-on-surface flex-1 truncate">{etapa.name}</span>
      <div className="flex items-center gap-2 w-36">
        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={barStyle} />
        </div>
        <span className="text-xs text-on-surface-variant w-8 text-right">{progress}%</span>
      </div>
    </div>
  )
}

const counterCard = tv({
  base: "rounded-lg p-3 text-center",
  variants: {
    variant: {
      neutral: "bg-surface-container",
      primary: "bg-primary/10",
      secondary: "bg-secondary/10",
    },
  },
})

type CounterVariant = "neutral" | "primary" | "secondary"

function CounterCard({ count, label, variant }: { count: number; label: string; variant: CounterVariant }) {
  return (
    <div className={counterCard({ variant })}>
      <p className="text-xl font-black text-on-surface">{count}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  )
}

interface VisaoGeralProps {
  project: Project
  acompanhamento: ProjetoAcompanhamento
}

export function VisaoGeral({ project, acompanhamento }: VisaoGeralProps) {
  const { t } = useTranslation()
  const totalProgress = calcTotalProgress(acompanhamento)
  const etapasPercent = calcEtapasPercent(acompanhamento)
  const emAndamento = calcEtapasEmAndamento(acompanhamento)
  const totalBarStyle: CSSProperties = { width: `${totalProgress}%` }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1 bg-surface-container-low rounded-xl p-6 space-y-6">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t("obra.visaoGeral.title")}</h2>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant">{t("obra.visaoGeral.totalProgress")}</span>
            <span className="font-semibold text-on-surface">{totalProgress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={totalBarStyle} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoCard icon={MapPin} label={t("obra.visaoGeral.location")}>
            <p className="text-sm text-on-surface line-clamp-2">{formatProjectAddress(project)}</p>
          </InfoCard>
          <InfoCard icon={Calendar} label={t("obra.visaoGeral.deadline")}>
            <PrazoContent start={project.plannedStartDate} end={project.plannedEndDate} />
          </InfoCard>
          <InfoCard icon={Layers} label={t("obra.visaoGeral.areas")}>
            <p className="text-sm text-on-surface">
              {t("obra.visaoGeral.landArea")}: {project.landArea}{M2}
              {" · "}
              {t("obra.visaoGeral.builtArea")}: {project.builtArea}{M2}
            </p>
          </InfoCard>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t("obra.visaoGeral.stages")}</h3>
          {acompanhamento.etapas.map(etapa => (
            <EtapaRow key={etapa.id} etapa={etapa} />
          ))}
        </div>
      </div>

      <div className="w-full lg:w-72 bg-surface-container-low rounded-xl p-6 flex flex-col gap-6">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{t("obra.visaoGeral.stagesProgress")}</h2>
        <div className="flex justify-center">
          <ProgressRing percent={etapasPercent} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <CounterCard count={acompanhamento.totalEtapas} label={t("obra.visaoGeral.total")} variant="neutral" />
          <CounterCard count={emAndamento} label={t("obra.visaoGeral.inProgress")} variant="primary" />
          <CounterCard count={acompanhamento.etapasConcluidas} label={t("obra.visaoGeral.completed")} variant="secondary" />
        </div>
      </div>
    </div>
  )
}
