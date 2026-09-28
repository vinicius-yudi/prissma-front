import { AlertTriangle, Plus, RefreshCw, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Num } from "@/shared/components/ui/num/Num"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { useAccess } from "@/shared/hooks/useAccess"

import { usePreviaIA } from "../hooks/usePreviaIA"
import { usePropostas } from "../hooks/usePropostas"
import type { PreviewOptions, Proposal } from "../types/proposal"
import { PreviaIAModal } from "./PreviaIAModal"
import { PropostaCard } from "./PropostaCard"
import { PropostaFormModal } from "./PropostaFormModal"
import { VersoesProposta } from "./VersoesProposta"

interface PropostasTabProps {
  projectId: number
}

function EmptyState({ canMutate, onCreate }: { canMutate: boolean; onCreate: () => void }) {
  const { t } = useTranslation()

  return (
    <section className="flex flex-col items-center gap-3.5 rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-14 text-center">
      {/* Ambiente em planta, traço ouro — a ilustração de vazio do Style Guide
          v2 §4, no vocabulário desta tela. */}
      <svg
        width="112"
        height="82"
        viewBox="0 0 96 72"
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="1.2"
        aria-hidden
      >
        <path d="M12 60V12h72v48H12z" />
        <path d="M12 34h30V12M42 60V46h42" />
        <path d="M58 22h16v12H58z" />
        <path d="M20 44h14v10H20z" strokeDasharray="3 4" />
      </svg>

      <p className="text-sm font-semibold text-on-surface">{t("obra.propostas.emptyTitle")}</p>
      <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">
        {t("obra.propostas.emptyDescription")}
      </p>

      {canMutate && (
        <Button variant="primary" size="sm" fullWidth={false} onClick={onCreate} className="mt-1">
          <Plus size={15} />
          {t("obra.propostas.actions.create")}
        </Button>
      )}
    </section>
  )
}

/**
 * Propostas / Design & IA (Telas §19).
 *
 * Grade de cards, cada um com a versão mais recente da proposta. Duas ações
 * escrevem: criar uma proposta (que nasce na v1, com ou sem imagem) e gerar uma
 * prévia por IA, que vira a **versão seguinte** — é isso que dá o histórico
 * v1/v2/v3 da spec sem um conceito novo.
 *
 * A geração é assíncrona: o disparo responde 202 e o `usePreviaIA` faz o
 * polling. Só um card gera por vez, o do `activeProposalId`; disparar duas
 * gerações simultâneas confundiria o polling, que acompanha um job só.
 */
export function PropostasTab({ projectId }: PropostasTabProps) {
  const { t } = useTranslation()
  const { isReadOnly } = useAccess()
  const canMutate = !isReadOnly("propostas")

  const { proposals, isLoading, error, remove, isDeleting, validateImage } = usePropostas(projectId)
  const previa = usePreviaIA(projectId)

  const [isFormOpen, setFormOpen] = useState(false)
  const [previaTarget, setPreviaTarget] = useState<Proposal | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Proposal | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Proposal | null>(null)

  // Precisa vir antes de qualquer early return: é o que alimenta o FAB da
  // barra de abas no celular. A prévia não cabe no FAB porque exige um card
  // escolhido — a ação única da tela é criar a proposta.
  usePrimaryAction(
    canMutate
      ? {
          label: t("obra.propostas.actions.create"),
          icon: Plus,
          onClick: () => setFormOpen(true),
        }
      : null,
  )

  // A prévia pronta fecha o modal: o resultado aparece no card, e manter o
  // formulário aberto sobre ele esconderia justamente o que o usuário esperou
  // 40s para ver. Falha mantém o modal, que é onde o erro é mostrado.
  // Derivado em vez de efeito: um setState dentro de useEffect aqui provocaria
  // um render em cascata a cada tique do polling.
  const isPreviaReady = previa.preview?.status === "READY"
  const isPreviaOpen = !!previaTarget && !isPreviaReady

  function openPrevia(proposal: Proposal) {
    previa.reset()
    setPreviaTarget(proposal)
  }

  function closePrevia() {
    setPreviaTarget(null)
    previa.reset()
  }

  function handleGenerate(input: {
    rawImage: File
    floorPlan: File | null
    options: PreviewOptions
  }) {
    if (!previaTarget) return
    previa.start({ proposalId: previaTarget.id, ...input })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    remove(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
  }

  function renderBody() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface-container-low" />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-low p-12">
          <p className="text-sm text-on-surface-variant">{t("obra.acompError")}</p>
          <Button variant="outline" fullWidth={false} onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            {t("obra.retry")}
          </Button>
        </div>
      )
    }

    if (proposals.length === 0) {
      return <EmptyState canMutate={canMutate} onCreate={() => setFormOpen(true)} />
    }

    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {proposals.map((proposal) => (
          <PropostaCard
            key={proposal.id}
            projectId={projectId}
            proposal={proposal}
            canMutate={canMutate}
            isGenerating={previa.isProcessing && previa.activeProposalId === proposal.id}
            onGenerate={openPrevia}
            onHistory={setHistoryTarget}
            onDelete={setPendingDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-semibold text-on-surface">{t("obra.propostas.title")}</h2>
          {proposals.length > 0 && (
            <Num className="text-[11.5px] text-on-surface-faint">
              {t("obra.propostas.count", { count: proposals.length })}
            </Num>
          )}
        </div>

        {canMutate && (
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={() => setFormOpen(true)}
            // No celular quem cria é o FAB da barra de abas — dois botões de
            // criação na mesma vista competiriam entre si.
            className="ml-auto hidden lg:inline-flex"
          >
            <Plus size={15} />
            {t("obra.propostas.actions.create")}
          </Button>
        )}
      </div>

      {/* Aviso de IA no topo: vale para a tela toda, não só para o modal. */}
      <p className="flex items-start gap-2 text-[11.5px] leading-relaxed text-on-surface-faint">
        <Sparkles size={13} strokeWidth={1.8} className="mt-px shrink-0 text-gold-bright" />
        {t("obra.propostas.previa.warning")}
      </p>

      {renderBody()}

      <PropostaFormModal
        open={isFormOpen}
        onClose={() => setFormOpen(false)}
        projectId={projectId}
      />

      <PreviaIAModal
        open={isPreviaOpen}
        onClose={closePrevia}
        proposal={previaTarget}
        isProcessing={previa.isProcessing}
        errorMessage={previa.errorMessage}
        onGenerate={handleGenerate}
        validateImage={validateImage}
      />

      <VersoesProposta
        open={!!historyTarget}
        onClose={() => setHistoryTarget(null)}
        projectId={projectId}
        proposal={historyTarget}
        canMutate={canMutate}
      />

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t("obra.propostas.deleteModal.title")}
        icon={<AlertTriangle size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="space-y-5 px-6 pb-6">
          <p className="text-sm leading-relaxed text-on-surface-variant">
            {t("obra.propostas.deleteModal.message", { title: pendingDelete?.title ?? "" })}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={isDeleting}>
              {t("obra.propostas.actions.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting
                ? t("obra.propostas.deleteModal.deleting")
                : t("obra.propostas.deleteModal.confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
