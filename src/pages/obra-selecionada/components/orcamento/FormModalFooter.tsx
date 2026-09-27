import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

interface FormModalFooterProps {
  isSubmitting: boolean
  onCancel: () => void
  onSave: () => void
}

/** Cancelar + Salvar dos modais de orçamento e categoria. */
export function FormModalFooter({ isSubmitting, onCancel, onSave }: FormModalFooterProps) {
  const { t } = useTranslation()

  return (
    <>
      <Button variant="outline" fullWidth={false} onClick={onCancel} disabled={isSubmitting}>
        {t("obra.orcamento.actions.cancel")}
      </Button>
      <Button fullWidth={false} onClick={onSave} disabled={isSubmitting}>
        {isSubmitting && <Loader2 size={16} className="animate-spin" />}
        {isSubmitting ? t("obra.orcamento.actions.saving") : t("obra.orcamento.actions.save")}
      </Button>
    </>
  )
}
