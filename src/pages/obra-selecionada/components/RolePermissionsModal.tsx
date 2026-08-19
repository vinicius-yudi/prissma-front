import type { ChangeEvent } from "react"
import { useState } from "react"
import { Loader, ShieldCheck } from "lucide-react"

import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"

import { useRolePermissions } from "../hooks/useRolePermissions"
import {
  EDITABLE_PROJECT_ROLES,
  ProjectRole,
} from "../services/projectPermissions.service"
import { RolePermissionsEditor } from "./RolePermissionsEditor"

const ROLE_LABELS = new Map<ProjectRole, string>([
  [ProjectRole.OWNER, "Proprietário"],
  [ProjectRole.ENGINEER, "Engenheiro"],
  [ProjectRole.ARCHITECT, "Arquiteto"],
  [ProjectRole.FOREMAN, "Externo"],
])

interface RolePermissionsModalProps {
  open: boolean
  onClose: () => void
  projectId: number
}

export function RolePermissionsModal({ open, onClose, projectId }: RolePermissionsModalProps) {
  const [role, setRole] = useState<ProjectRole>(ProjectRole.ENGINEER)
  const { permissions, isLoading, isError } = useRolePermissions(projectId, open ? role : null)

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    setRole(event.currentTarget.value as ProjectRole)
  }

  function renderBody() {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader className="animate-spin" size={24} />
        </div>
      )
    }

    if (isError) {
      return (
        <p className="py-8 text-center text-sm text-error">
          Não foi possível carregar as permissões deste papel.
        </p>
      )
    }

    return (
      <RolePermissionsEditor
        key={role}
        projectId={projectId}
        role={role}
        initialPermissions={permissions}
        onSaved={onClose}
      />
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Permissões por papel"
      description="Defina o que cada papel pode fazer neste projeto."
      icon={<ShieldCheck size={20} />}
      size="lg"
    >
      <div className="space-y-5 px-6 pb-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">Papel</label>
          <Select value={role} onChange={handleRoleChange}>
            {EDITABLE_PROJECT_ROLES.map(projectRole => (
              <option key={projectRole} value={projectRole}>
                {ROLE_LABELS.get(projectRole) ?? projectRole}
              </option>
            ))}
          </Select>
        </div>

        {renderBody()}
      </div>
    </Modal>
  )
}
