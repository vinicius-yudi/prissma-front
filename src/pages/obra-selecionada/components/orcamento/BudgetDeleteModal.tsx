import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { BudgetDeleteTarget } from "../../hooks/useBudgetModals"

const TITLE_KEY: Record<BudgetDeleteTarget["kind"], string> = {
  budget: "obra.orcamento.delete.budgetTitle",
  item: "obra.orcamento.delete.itemTitle",
}

const MESSAGE_KEY: Record<BudgetDeleteTarget["kind"], string> = {
  budget: "obra.orcamento.delete.budgetMessage",
  item: "obra.orcamento.delete.itemMessage",
}

interface BudgetDeleteModalProps {
  target: BudgetDeleteTarget | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

/** Confirmação de exclusão de orçamento, categoria ou despesa. */
export function BudgetDeleteModal({ target, isSubmitting, onClose, onConfirm }: BudgetDeleteModalProps) {
  const { t } = useTranslation()
  const name = target && "name" in target ? target.name : ""

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? t(TITLE_KEY[target.kind]) : ""}
      description={target ? t(MESSAGE_KEY[target.kind], { name }) : undefined}
      icon={<AlertTriangle size={18} />}
      variant="danger"
      size="sm"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onClose} disabled={isSubmitting}>
            {t("obra.orcamento.actions.cancel")}
          </Button>
          <Button variant="destructive" fullWidth={false} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? t("obra.orcamento.actions.deleting") : t("obra.orcamento.actions.delete")}
          </Button>
        </>
      }
    />
  )
}
