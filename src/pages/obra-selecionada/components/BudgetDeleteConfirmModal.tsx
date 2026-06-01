import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"

import type { BudgetDeleteTarget } from "../hooks/useBudgetModals"

interface BudgetDeleteConfirmModalProps {
  target: BudgetDeleteTarget | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

const TITLE_KEY: Record<BudgetDeleteTarget["kind"], string> = {
  budget: "obra.orcamento.delete.budgetTitle",
  item: "obra.orcamento.delete.itemTitle",
  expense: "obra.orcamento.delete.expenseTitle",
}

const MESSAGE_KEY: Record<BudgetDeleteTarget["kind"], string> = {
  budget: "obra.orcamento.delete.budgetMessage",
  item: "obra.orcamento.delete.itemMessage",
  expense: "obra.orcamento.delete.expenseMessage",
}

export function BudgetDeleteConfirmModal({
  target,
  isSubmitting,
  onClose,
  onConfirm,
}: BudgetDeleteConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target ? t(TITLE_KEY[target.kind]) : ""}
      icon={<AlertTriangle size={20} />}
      variant="danger"
      size="sm"
    >
      <div className="px-6 pb-6 space-y-5">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {target ? t(MESSAGE_KEY[target.kind]) : ""}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("obra.orcamento.actions.cancel")}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-error text-on-error border-0 hover:brightness-[0.92]"
          >
            {isSubmitting
              ? t("obra.orcamento.actions.deleting")
              : t("obra.orcamento.actions.delete")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
