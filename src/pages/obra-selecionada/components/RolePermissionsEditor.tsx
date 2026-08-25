import type { ChangeEvent } from "react"
import { useState } from "react"
import { Loader } from "lucide-react"
import { tv } from "tailwind-variants"

import { Button } from "@/shared/components/ui/button/Button"

import { useUpdateRolePermissions } from "../hooks/useRolePermissions"
import {
  ALL_PROJECT_PERMISSIONS,
  ProjectPermission,
  type ProjectRole,
} from "../services/projectPermissions.service"

const PERMISSION_LABELS = new Map<ProjectPermission, string>([
  [ProjectPermission.VIEW_PROJECT, "Visualizar projeto"],
  [ProjectPermission.MANAGE_MEMBERS, "Gerenciar membros"],
  [ProjectPermission.MANAGE_BUDGET, "Gerenciar orçamento"],
  [ProjectPermission.MANAGE_STAGES, "Gerenciar etapas"],
  [ProjectPermission.MANAGE_TEAMS, "Gerenciar equipes"],
  [ProjectPermission.MANAGE_TASKS, "Gerenciar tarefas"],
  [ProjectPermission.MANAGE_ATTACHMENTS, "Gerenciar anexos"],
])

const permissionRow = tv({
  base: "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors cursor-pointer",
  variants: {
    checked: {
      true: "border-primary bg-primary/10",
      false: "border-outline-variant/60 bg-surface-container",
    },
  },
})

interface RolePermissionsEditorProps {
  projectId: number
  role: ProjectRole
  initialPermissions: ProjectPermission[]
  /** Opcional: em página não há modal para fechar. */
  onSaved?: () => void
}

export function RolePermissionsEditor({
  projectId,
  role,
  initialPermissions,
  onSaved,
}: RolePermissionsEditorProps) {
  const [selected, setSelected] = useState<Set<ProjectPermission>>(
    new Set(initialPermissions),
  )
  const { updatePermissions, isUpdating } = useUpdateRolePermissions(projectId)

  function handleToggle(event: ChangeEvent<HTMLInputElement>) {
    const permission = event.currentTarget.dataset.permission as ProjectPermission
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(permission)) {
        next.delete(permission)
      } else {
        next.add(permission)
      }
      return next
    })
  }

  function handleSave() {
    updatePermissions(
      { role, permissions: [...selected] },
      { onSuccess: () => onSaved?.() },
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {ALL_PROJECT_PERMISSIONS.map(permission => {
          const checked = selected.has(permission)
          return (
            <label key={permission} className={permissionRow({ checked })}>
              <span className="text-sm text-on-surface">
                {PERMISSION_LABELS.get(permission) ?? permission}
              </span>
              <input
                type="checkbox"
                checked={checked}
                data-permission={permission}
                onChange={handleToggle}
                className="h-4 w-4 accent-primary cursor-pointer"
              />
            </label>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating} className="w-auto px-6">
          {isUpdating ? (
            <>
              <Loader size={16} className="animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            "Salvar permissões"
          )}
        </Button>
      </div>
    </div>
  )
}
