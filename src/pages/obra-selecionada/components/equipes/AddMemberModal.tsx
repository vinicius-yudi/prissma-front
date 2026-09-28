import { Loader2, Search, UserPlus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { WorkspaceRole } from "@/shared/types/workspace"

import { ASSIGNABLE_ROLES } from "../../constants/equipes"
import { RoleInProject, type AvailableUser, type ProjectRoleInRequest } from "../../types/equipes"
import { normalizeText } from "../../utils/taskFilters"
import { CandidateList } from "./CandidateList"
import { RolePicker } from "./RolePicker"

/** Cliente da conta só entra na obra como cliente. */
const CLIENT_ONLY: ProjectRoleInRequest[] = [RoleInProject.ENGINEER, RoleInProject.ARCHITECT, RoleInProject.FOREMAN]

interface AddMemberModalProps {
  open: boolean
  onClose: () => void
  candidates: AvailableUser[]
  isLoading: boolean
  isAdding: boolean
  permissionSummary: (role: ProjectRoleInRequest) => string | null
  onAdd: (userId: number, role: ProjectRoleInRequest) => Promise<unknown>
}

/**
 * Adicionar à obra quem já é da conta: busca, escolha a pessoa e o papel.
 * Estado próprio e zerado a cada abertura (quem abre troca a `key`).
 */
export function AddMemberModal({ open, onClose, candidates, isLoading, isAdding, permissionSummary, onAdd }: AddMemberModalProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [role, setRole] = useState<ProjectRoleInRequest>(RoleInProject.ENGINEER)

  const term = normalizeText(query.trim())
  const shown = candidates.filter((user) => !term || normalizeText(`${user.name} ${user.email}`).includes(term))
  const selected = candidates.find((user) => user.id === userId) ?? null
  const isClient = selected?.role === WorkspaceRole.CLIENT

  function select(user: AvailableUser) {
    setUserId(user.id)
    if (user.role === WorkspaceRole.CLIENT) setRole(RoleInProject.USER)
  }

  function handleAdd() {
    if (!selected) return
    onAdd(selected.id, role).then(onClose, () => undefined)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("obra.equipes.addModal.title")}
      description={t("obra.equipes.addModal.hint")}
      icon={<UserPlus size={18} />}
      size="lg"
      footer={
        <>
          <Button variant="outline" fullWidth={false} onClick={onClose} disabled={isAdding}>
            {t("obra.equipes.actions.cancel")}
          </Button>
          <Button fullWidth={false} onClick={handleAdd} disabled={!selected || isAdding}>
            {isAdding && <Loader2 size={16} className="animate-spin" />}
            {t("obra.equipes.addModal.confirm")}
          </Button>
        </>
      }
    >
      <div className="grid gap-5 px-6 pt-5 pb-6">
        <label className="relative block">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-3" />
          <span className="sr-only">{t("obra.equipes.addModal.searchPlaceholder")}</span>
          <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("obra.equipes.addModal.searchPlaceholder")} className="pl-9" />
        </label>

        <CandidateList users={shown} isLoading={isLoading} searching={!!query.trim()} selectedId={userId} onSelect={select} />

        {selected && (
          <div>
            <p className="t-label mb-2 text-ink-2">{t("obra.equipes.addModal.roleLabel")}</p>
            <RolePicker roles={ASSIGNABLE_ROLES} value={role} disabledRoles={isClient ? CLIENT_ONLY : []} permissionSummary={permissionSummary} onChange={setRole} />
          </div>
        )}
      </div>
    </Modal>
  )
}
