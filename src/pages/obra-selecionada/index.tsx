import type { MouseEvent } from "react"
import { useState } from "react"
import { ArrowLeft, MapPin, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { DeleteProjectModal } from "@/pages/projetos/components/DeleteProjectModal"
import { ProjectStepModal } from "@/pages/projetos/components/ProjectStepModal"
import type { ProjetoAcompanhamento } from "@/pages/projetos/types"
import type { Project } from "@/shared/types/project"

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

function AcompErrorCard({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 bg-surface-container-low rounded-xl border border-error/20">
      <p className="text-on-surface-variant text-sm">{t("obra.acompError")}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw size={14} />
        {t("obra.retry")}
      </Button>
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
  acompanhamento: ProjetoAcompanhamento | undefined
  acompError: boolean
  onRetry: () => void
}

function TabContent({ tab, project, acompanhamento, acompError, onRetry }: TabContentProps) {
  if (tab === "visaoGeral") {
    if (acompError) return <AcompErrorCard onRetry={onRetry} />
    if (!acompanhamento) return <LoadingState />
    return <VisaoGeral project={project} acompanhamento={acompanhamento} />
  }
  if (tab === "etapas") {
    if (acompError) return <AcompErrorCard onRetry={onRetry} />
    if (!acompanhamento) return <LoadingState />
    return <EtapasTab acompanhamento={acompanhamento} />
  }
  return <ComingSoon />
}

export function ObraSelecionadaPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>("visaoGeral")
  const id = Number(idParam)

  const { projectQuery, acompQuery } = useObraSelecionada(id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  function handleBack() {
    navigate(-1)
  }

  function handleTabChange(e: MouseEvent<HTMLButtonElement>) {
    const tab = e.currentTarget.dataset.tab
    if (isTabKey(tab)) setActiveTab(tab)
  }

  function handleRetry() {
    acompQuery.refetch()
  }

  if (!id) return <NotFoundState onBack={handleBack} />
  if (projectQuery.isLoading || acompQuery.isLoading) return <LoadingState />
  if (projectQuery.isError) return <NotFoundState onBack={handleBack} />
  if (!projectQuery.data) return null

  const project = projectQuery.data

  return (
    <div>
      <header className="flex justify-between items-center pb-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors w-fit"
          >
            <ArrowLeft size={14} />
            {t("obra.back")}
          </button>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface">{project.title}</h1>
          <p className="text-primary text-sm flex items-center gap-2">
            <MapPin size={14} />
            {[`${project.city} - ${project.state}`].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="w-auto px-5 py-2.5 text-sm text-error border-error/40 hover:bg-error/10 hover:border-error" onClick={() => setDeleteOpen(true)}>{t("obra.delete")}</Button>
          <Button variant="primary" className="w-auto px-5 py-2.5 text-sm" onClick={() => setEditOpen(true)}>{t("obra.edit")}</Button>
        </div>
      </header>

      <nav className="bg-surface-container-low px-4 pt-2 pb-0 border border-outline-variant/10 rounded-xl flex gap-1">
        {TABS.map(tab => (
          <Button
            key={tab}
            data-tab={tab}
            variant={getTabVariant(tab, activeTab)}
            onClick={handleTabChange}
            className="w-auto px-4 py-2 text-sm"
          >
            {t(TAB_KEYS[tab])}
          </Button>
        ))}
      </nav>

      <main className="py-6">
        <TabContent
          tab={activeTab}
          project={project}
          acompanhamento={acompQuery.data}
          acompError={acompQuery.isError}
          onRetry={handleRetry}
        />
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
