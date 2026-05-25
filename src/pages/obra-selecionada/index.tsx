import type { MouseEvent } from "react"
import { useState } from "react"
import { ArrowLeft, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { DeleteProjectModal } from "@/pages/projetos/components/DeleteProjectModal"
import { ProjectStepModal } from "@/pages/projetos/components/ProjectStepModal"
import { formatProjectAddress, type Project } from "@/shared/types/project"

import { DocumentosTab } from "./components/DocumentosTab"
import { EtapasTab } from "./components/EtapasTab"
import { VisaoGeral } from "./components/visaoGeral"
import { useObraSelecionada } from "./hooks/useObraSelecionada"
import { TABS, TAB_KEYS, type TabKey } from "./types"

function getTabVariant(tab: TabKey, active: TabKey): "menuSelected" | "menu" {
  if (tab === active) return "menuSelected"
  return "menu"
}

function isTabKey(value: unknown): value is TabKey {
  return typeof value === "string" && (TABS as readonly string[]).includes(value)
}

function LoadingState() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-surface-container-low rounded-xl w-1/3" />
      <div className="h-4 bg-surface-container-low rounded w-1/4" />
      <div className="h-12 bg-surface-container-low rounded-xl mt-4" />
      <div className="h-64 bg-surface-container-low rounded-xl" />
    </div>
  )
}

function NotFoundState({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <h2 className="text-xl font-semibold text-on-surface">{t("obra.notFound")}</h2>
      <p className="text-on-surface-variant">{t("obra.notFoundDesc")}</p>
      <Button variant="outline" onClick={onBack}>{t("obra.backToList")}</Button>
    </div>
  )
}

function ComingSoon() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center p-20 text-on-surface-variant">
      {t("obra.comingSoon")}
    </div>
  )
}

interface TabContentProps {
  tab: TabKey
  project: Project
}

function TabContent({ tab, project }: TabContentProps) {
  if (tab === "visaoGeral") {
    return <VisaoGeral project={project} />
  }
  if (tab === "etapas") {
    return <EtapasTab projectId={project.id} />
  }
  if (tab === "documentos") {
    return <DocumentosTab projectId={project.id} />
  }
  return <ComingSoon />
}

export function ObraSelecionadaPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>("visaoGeral")
  const id = Number(idParam)

  const { projectQuery } = useObraSelecionada(id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleBack() {
    navigate(-1)
  }

  function handleTabChange(e: MouseEvent<HTMLButtonElement>) {
    const tab = e.currentTarget.dataset.tab
    if (isTabKey(tab)) setActiveTab(tab)
  }

  if (!id) return <NotFoundState onBack={handleBack} />
  if (projectQuery.isLoading) return <LoadingState />
  if (projectQuery.isError) return <NotFoundState onBack={handleBack} />
  if (!projectQuery.data) return null

  const project = projectQuery.data

  return (
    <div>
      <header className="flex flex-col gap-3 pb-4 sm:flex-row sm:justify-between sm:items-start">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors w-fit"
          >
            <ArrowLeft size={14} />
            {t("obra.back")}
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-on-surface">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-primary text-sm flex items-center gap-2">
            <MapPin size={14} />
            {formatProjectAddress(project)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="flex-1 sm:flex-none w-auto px-4 py-2 text-sm text-error border-error/40 hover:bg-error/10 hover:border-error" onClick={() => setDeleteOpen(true)}>{t("obra.delete")}</Button>
          <Button variant="primary" className="flex-1 sm:flex-none w-auto px-4 py-2 text-sm" onClick={() => setEditOpen(true)}>{t("obra.edit")}</Button>
        </div>
      </header>

      <nav className="bg-surface-container-low px-4 pt-2 pb-0 border border-outline-variant/10 rounded-xl flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <Button
            key={tab}
            data-tab={tab}
            variant={getTabVariant(tab, activeTab)}
            onClick={handleTabChange}
            className="w-auto px-4 py-2 text-sm shrink-0 whitespace-nowrap"
          >
            {t(TAB_KEYS[tab])}
          </Button>
        ))}
      </nav>

      <main className="py-6">
        <TabContent tab={activeTab} project={project} />
      </main>

      <ProjectStepModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <DeleteProjectModal
        project={deleteOpen ? project : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => navigate("/projetos")}
      />
    </div>
  )
}
