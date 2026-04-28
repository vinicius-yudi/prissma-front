import { Calendar } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { Etapa, EtapaStatus, ProjetoAcompanhamento, Tarefa, TarefaPriority, TarefaStatus } from "@/pages/projetos/types"

const ETAPA_STATUS_KEY: Record<EtapaStatus, string> = {
  PLANNED: "obra.etapas.etapaStatus.PLANNED",
  IN_PROGRESS: "obra.etapas.etapaStatus.IN_PROGRESS",
  DONE: "obra.etapas.etapaStatus.DONE",
  BLOCKED: "obra.etapas.etapaStatus.BLOCKED",
}

const TAREFA_STATUS_KEY: Record<TarefaStatus, string> = {
  TODO: "obra.etapas.tarefaStatus.TODO",
  IN_PROGRESS: "obra.etapas.tarefaStatus.IN_PROGRESS",
  DONE: "obra.etapas.tarefaStatus.DONE",
  BLOCKED: "obra.etapas.tarefaStatus.BLOCKED",
}

const TAREFA_PRIORITY_KEY: Record<TarefaPriority, string> = {
  HIGH: "obra.etapas.priority.HIGH",
  MEDIUM: "obra.etapas.priority.MEDIUM",
  LOW: "obra.etapas.priority.LOW",
}

const etapaStatusBadge = tv({
  base: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
  variants: {
    status: {
      PLANNED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      IN_PROGRESS: "bg-primary/10 text-primary border-primary/20",
      DONE: "bg-secondary/10 text-secondary border-secondary/20",
      BLOCKED: "bg-error/10 text-error border-error/20",
    },
  },
})

const tarefaStatusBadge = tv({
  base: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
  variants: {
    status: {
      TODO: "bg-surface-container-highest text-on-surface-variant border-outline-variant",
      IN_PROGRESS: "bg-primary/10 text-primary border-primary/20",
      DONE: "bg-secondary/10 text-secondary border-secondary/20",
      BLOCKED: "bg-error/10 text-error border-error/20",
    },
  },
})

const priorityBadge = tv({
  base: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border",
  variants: {
    priority: {
      HIGH: "bg-error/10 text-error border-error/20",
      MEDIUM: "bg-tertiary/10 text-tertiary border-tertiary/20",
      LOW: "bg-surface-container-highest text-on-surface-variant border-outline-variant",
    },
  },
})

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR")
}

function TasksList({ tasks }: { tasks: Tarefa[] }) {
  const { t } = useTranslation()
  if (tasks.length === 0) {
    return <p className="text-sm text-on-surface-variant py-2">{t("obra.etapas.tasksEmpty")}</p>
  }
  return (
    <>
      {tasks.map(tarefa => (
        <TarefaRow key={tarefa.id} tarefa={tarefa} />
      ))}
    </>
  )
}

function TarefaRow({ tarefa }: { tarefa: Tarefa }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-start gap-3 py-3 border-b border-outline-variant/20 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface font-medium">{tarefa.title}</p>
        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{tarefa.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={priorityBadge({ priority: tarefa.priority })}>
          {t(TAREFA_PRIORITY_KEY[tarefa.priority])}
        </span>
        <span className={tarefaStatusBadge({ status: tarefa.status })}>
          {t(TAREFA_STATUS_KEY[tarefa.status])}
        </span>
      </div>
    </div>
  )
}

function EtapaCard({ etapa }: { etapa: Etapa }) {
  const { t } = useTranslation()
  return (
    <div className="bg-surface-container-low rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant font-medium">#{etapa.displayOrder}</span>
            <h3 className="font-semibold text-on-surface">{etapa.name}</h3>
          </div>
          <p className="text-sm text-on-surface-variant line-clamp-1">{etapa.description}</p>
        </div>
        <span className={etapaStatusBadge({ status: etapa.status, class: "shrink-0" })}>
          {t(ETAPA_STATUS_KEY[etapa.status])}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Calendar size={12} />
        {formatDate(etapa.plannedStartDate)}
        {" → "}
        {formatDate(etapa.plannedEndDate)}
      </div>

      <div className="space-y-0">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest pb-2">{t("obra.etapas.tasks")}</p>
        <TasksList tasks={etapa.tasks} />
      </div>
    </div>
  )
}

interface EtapasTabProps {
  acompanhamento: ProjetoAcompanhamento
}

export function EtapasTab({ acompanhamento }: EtapasTabProps) {
  const { t } = useTranslation()
  if (acompanhamento.etapas.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-on-surface-variant text-sm">
        {t("obra.etapas.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {acompanhamento.etapas.map(etapa => (
        <EtapaCard key={etapa.id} etapa={etapa} />
      ))}
    </div>
  )
}
