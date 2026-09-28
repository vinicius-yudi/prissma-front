import { AlertTriangle, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import { usePreviaForm, type GenerateInput } from "../../hooks/usePreviaForm"
import type { Proposal } from "../../types/proposal"
import { GeneratingBar } from "./GeneratingBar"
import { PreviaImageFields } from "./PreviaImageFields"
import { PreviaOptionsFields } from "./PreviaOptionsFields"

interface PreviaIAModalProps {
  open: boolean
  onClose: () => void
  proposal: Proposal
  isProcessing: boolean
  errorMessage: string | null
  onGenerate: (input: GenerateInput) => void
  validateImage: (file: File) => boolean
}

/**
 * "✦ Prévia visual IA" (Telas §19). O aviso da espera longa vem antes do
 * disparo; enquanto processa, a barra é indeterminada e o formulário fica
 * desabilitado — não desmontado — para uma falha não apagar as escolhas.
 */
export function PreviaIAModal({ open, onClose, proposal, isProcessing, errorMessage, onGenerate, validateImage }: PreviaIAModalProps) {
  const { t } = useTranslation()
  const state = usePreviaForm({ proposal, validateImage, onGenerate })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.propostas.previa.title")}
      description={proposal.title}
      icon={<Sparkles size={18} />}
      size="2xl"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onClose}>
            {t("obra.propostas.actions.close")}
          </Button>
          <Button fullWidth={false} onClick={state.handleGenerate} disabled={isProcessing}>
            <Sparkles size={14} />
            {isProcessing ? t("obra.propostas.previa.generating") : t("obra.propostas.previa.submit")}
          </Button>
        </>
      }
    >
      <form
        noValidate
        className="grid gap-5 px-6 pt-5 pb-6"
        onSubmit={(event) => {
          event.preventDefault()
          state.handleGenerate()
        }}
      >
        <p className="flex items-start gap-2 rounded-md bg-gold-soft/60 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
          <Sparkles size={14} className="mt-0.5 flex-none text-gold-hi" />
          {t("obra.propostas.previa.warning")}
        </p>

        <fieldset disabled={isProcessing} className="grid min-w-0 gap-5">
          <PreviaImageFields state={state} />
          <PreviaOptionsFields state={state} />
        </fieldset>

        {isProcessing && (
          <div className="space-y-2">
            <GeneratingBar label={t("obra.propostas.generating")} />
            <p className="text-center text-[12.5px] text-ink-2">{t("obra.propostas.previa.processing")}</p>
          </div>
        )}
        {!isProcessing && errorMessage && (
          <p role="alert" className="flex items-start gap-2 rounded-md bg-warning-soft px-4 py-3 text-[13px] leading-relaxed text-warning">
            <AlertTriangle size={14} className="mt-0.5 flex-none" />
            {errorMessage}
          </p>
        )}
        <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
