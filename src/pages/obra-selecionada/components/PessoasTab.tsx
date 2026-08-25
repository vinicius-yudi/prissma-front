import { Loader } from "lucide-react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"

import { RoleChip } from "@/shared/components/ui/role-chip/RoleChip"
import { Select } from "@/shared/components/ui/select/Select"

import { usePessoas } from "../hooks/usePessoas"
import { EDITABLE_PROJECT_ROLES, type ProjectRole } from "../services/projectPermissions.service"
import { RolePermissionsEditor } from "./RolePermissionsEditor"

/**
 * Pessoas & papéis (nível 2).
 *
 * Tabela de vinculados à obra + painel de permissões do papel selecionado,
 * como na tela 9 da spec. O painel reusa o <RolePermissionsEditor>, que já
 * existia dentro de um modal — aqui ele ganha a página que o design pede.
 *
 * A inclusão e remoção de integrantes continua em Equipes, onde a lógica já
 * vive; esta tela cuida de papel e permissão.
 */

interface PessoasTabProps {
  projectId: number
}

export function PessoasTab({ projectId }: PessoasTabProps) {
  const { t } = useTranslation()
  const pessoas = usePessoas(projectId)

  function handleRoleChange(event: ChangeEvent<HTMLSelectElement>) {
    pessoas.setRole(event.currentTarget.value as ProjectRole)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h2 className="text-base font-semibold text-on-surface">{t("pessoas.membersTitle")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("pessoas.membersHint")}</p>

        {pessoas.isLoadingMembers && (
          <div className="mt-5 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-container-high" />
            ))}
          </div>
        )}

        {pessoas.isErrorMembers && (
          <p className="mt-6 text-sm text-danger">{t("pessoas.membersError")}</p>
        )}

        {pessoas.members?.length === 0 && (
          <p className="mt-6 text-sm text-on-surface-variant">{t("pessoas.membersEmpty")}</p>
        )}

        <ul className="mt-4 divide-y divide-outline-variant">
          {pessoas.members?.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                {member.user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-on-surface">
                  {member.user.name}
                </span>
                <span className="block truncate text-xs text-on-surface-variant">
                  {member.user.email}
                </span>
              </span>
              <RoleChip role={member.roleInProject} />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
        <h2 className="text-base font-semibold text-on-surface">{t("pessoas.permissionsTitle")}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{t("pessoas.permissionsHint")}</p>

        <div className="mt-4">
          <Select value={pessoas.role} onChange={handleRoleChange}>
            {EDITABLE_PROJECT_ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4">
          {pessoas.isLoadingPermissions && (
            <div className="flex items-center justify-center py-10 text-on-surface-variant">
              <Loader className="animate-spin" size={22} />
            </div>
          )}

          {pessoas.isErrorPermissions && <p className="py-8 text-center text-sm text-danger">{t("pessoas.permissionsError")}</p>}

          {!pessoas.isLoadingPermissions && !pessoas.isErrorPermissions && (
            <RolePermissionsEditor
              key={pessoas.role}
              projectId={projectId}
              role={pessoas.role}
              initialPermissions={pessoas.permissions}
            />
          )}
        </div>
      </section>
    </div>
  )
}
