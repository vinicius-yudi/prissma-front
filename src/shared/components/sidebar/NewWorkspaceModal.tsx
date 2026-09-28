import { Building2, Loader } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { useWorkspaces } from "@/shared/hooks/useWorkspaces"

/**
 * Criação de workspace adicional ("Nova conta" do menu da sidebar).
 * Ao criar, o hook já troca para a conta nova (token novo + reload) —
 * por isso não há onSuccess local: a página inteira renasce na conta certa.
 */
export function NewWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { create, isCreating, createError } = useWorkspaces()
  const [name, setName] = useState("")

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || isCreating) return
    create(name.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("workspace.createTitle")}
      description={t("workspace.createHint")}
      icon={<Building2 size={20} />}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("workspace.namePlaceholder")}
          aria-label={t("workspace.nameLabel")}
          maxLength={130}
          required
        />

        {createError && (
          <p className="text-sm text-danger">{createError.message || t("workspace.createError")}</p>
        )}

        <Button type="submit" disabled={isCreating} className="w-full">
          {isCreating && <Loader size={16} className="animate-spin" />}
          {isCreating ? t("workspace.creating") : t("workspace.create")}
        </Button>
      </form>
    </Modal>
  )
}
