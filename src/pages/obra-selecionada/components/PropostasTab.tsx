import { Plus, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { useAccess } from "@/shared/hooks/useAccess"

import type { GenerateInput } from "../hooks/usePreviaForm"
import { usePreviaIA } from "../hooks/usePreviaIA"
import { usePropostas } from "../hooks/usePropostas"
import { PreviewState, type Proposal } from "../types/proposal"
import { DeletePropostaModal } from "./propostas/DeletePropostaModal"
import { PreviaIAModal } from "./propostas/PreviaIAModal"
import { PropostaFormModal } from "./propostas/PropostaFormModal"
import { PropostasContent } from "./propostas/PropostasContent"
import { VersoesProposta } from "./propostas/VersoesProposta"

interface PropostasTabProps {
  projectId: number
}

/**
 * Propostas / Design & IA (Telas §19). Grade de cards com a versão mais
 * recente de cada proposta. Gerar uma prévia por IA cria a **versão
 * seguinte** — é o que dá o histórico v1/v2/v3 sem um conceito novo.
 *
 * A geração é assíncrona (202 + polling no `usePreviaIA`) e só um card gera por
 * vez: o polling acompanha um job só.
 */
export function PropostasTab({ projectId }: PropostasTabProps) {
  const { t } = useTranslation()
  const { isReadOnly } = useAccess()
  const canMutate = !isReadOnly("propostas")
  const { proposals, isLoading, error, refetch, remove, isDeleting, validateImage } = usePropostas(projectId)
  const previa = usePreviaIA(projectId)

  const [formOpen, setFormOpen] = useState(false)
  // Nova `key` a cada abertura: os formulários remontam zerados, sem effect.
  const [formKey, setFormKey] = useState(0)
  const [previaTarget, setPreviaTarget] = useState<Proposal | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Proposal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Proposal | null>(null)

  function openCreate() {
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }

  // Antes de qualquer early return: alimenta a ação flutuante do celular. A
  // prévia exige um card escolhido, então a ação da tela é criar.
  usePrimaryAction(canMutate ? { label: t("obra.propostas.actions.create"), icon: Plus, onClick: openCreate } : null)

  // A prévia pronta fecha o modal: o resultado aparece no card. Falha mantém o
  // modal, que é onde o erro é mostrado. Derivado, não effect.
  const isPreviaOpen = !!previaTarget && previa.preview?.status !== PreviewState.READY

  function openPrevia(proposal: Proposal) {
    previa.reset()
    setFormKey((k) => k + 1)
    setPreviaTarget(proposal)
  }

  function closePrevia() {
    setPreviaTarget(null)
    previa.reset()
  }

  function handleGenerate(input: GenerateInput) {
    if (previaTarget) previa.start({ proposalId: previaTarget.id, ...input })
  }

  function confirmDelete() {
    if (pendingDelete) remove(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="t-section text-ink">{t("obra.propostas.title")}</h2>
          {proposals.length > 0 && <span className="t-data text-meta">{t("obra.propostas.count", { count: proposals.length })}</span>}
        </div>
        {canMutate && (
          // No celular quem cria é a ação flutuante.
          <Button size="sm" fullWidth={false} onClick={openCreate} className="hidden lg:inline-flex">
            <Plus size={15} />
            {t("obra.propostas.actions.create")}
          </Button>
        )}
      </div>

      {/* Aviso de IA no topo: vale para a tela toda, não só para o modal. */}
      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-meta">
        <Sparkles size={13} className="mt-0.5 flex-none text-gold-hi" />
        {t("obra.propostas.previa.warning")}
      </p>

      <PropostasContent
        projectId={projectId}
        proposals={proposals}
        isLoading={isLoading}
        isError={!!error}
        canMutate={canMutate}
        generatingId={previa.isProcessing ? previa.activeProposalId : null}
        onRetry={() => void refetch()}
        onCreate={openCreate}
        onGenerate={openPrevia}
        onHistory={setHistoryTarget}
        onDelete={setPendingDelete}
      />

      <PropostaFormModal key={`form-${formKey}`} open={formOpen} onClose={() => setFormOpen(false)} projectId={projectId} />
      {previaTarget && (
        <PreviaIAModal
          key={`previa-${formKey}`}
          open={isPreviaOpen}
          onClose={closePrevia}
          proposal={previaTarget}
          isProcessing={previa.isProcessing}
          errorMessage={previa.errorMessage}
          onGenerate={handleGenerate}
          validateImage={validateImage}
        />
      )}
      <VersoesProposta open={!!historyTarget} onClose={() => setHistoryTarget(null)} projectId={projectId} proposal={historyTarget} canMutate={canMutate} />
      <DeletePropostaModal proposal={pendingDelete} isDeleting={isDeleting} onCancel={() => setPendingDelete(null)} onConfirm={confirmDelete} />
    </div>
  )
}
