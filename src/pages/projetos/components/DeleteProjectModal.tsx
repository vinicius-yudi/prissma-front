import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import type { Project } from "@/shared/types/project"

import { useDeleteProject } from "../hooks/useDeleteProject"

interface DeleteProjectModalProps {
  project: Project | null
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteProjectModal({ project, onClose, onDeleted }: DeleteProjectModalProps) {
  const { t } = useTranslation()
  const { handleDelete, isLoading } = useDeleteProject({
    onSuccess: () => {
      onClose()
      onDeleted?.()
    },
  })

  return (
    <Modal
      open={!!project}
      onClose={onClose}
      title={t("projects.deleteModal.title")}
      icon={<AlertTriangle size={20} />}
      variant="danger"
      size="sm"
    >
      <div className="px-6 pb-6 space-y-5">
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {t("projects.deleteModal.message", { name: project?.title ?? "" })}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("projects.deleteModal.cancel")}
          </Button>
          <Button
            onClick={() => project && handleDelete(project.id)}
            disabled={isLoading}
            className="bg-error text-on-error border-0 hover:brightness-[0.92]"
          >
            {isLoading
              ? t("projects.deleteModal.deleting")
              : t("projects.deleteModal.confirm")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
