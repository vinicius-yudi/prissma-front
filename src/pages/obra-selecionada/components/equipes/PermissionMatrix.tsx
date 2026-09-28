import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"

import type { usePermissionMatrix } from "../../hooks/usePermissionMatrix"
import type { RoleInProject } from "../../types/equipes"
import { PermissionMatrixBody } from "./PermissionMatrixBody"

export interface PermissionMatrixProps {
  state: ReturnType<typeof usePermissionMatrix>
  memberCount: (role: RoleInProject) => number
  focusRole: RoleInProject | null
  onFocusRole: (role: RoleInProject | null) => void
}

/**
 * Papéis × permissões (redesign): a tabela inteira de uma vez, com o papel
 * em foco destacando quem o ocupa na lista de pessoas. Só aparece para quem
 * gerencia membros; nada vai ao servidor até "Salvar".
 */
export function PermissionMatrix({ state, memberCount, focusRole, onFocusRole }: PermissionMatrixProps) {
  const { t } = useTranslation()

  return (
    <section aria-label={t("obra.equipes.permissions.title")} className="overflow-hidden rounded-lg bg-surface hairline">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-1 sm:px-6">
        <div>
          <h2 className="t-section text-ink">{t("obra.equipes.permissions.title")}</h2>
          <p className="mt-1 text-[13px] text-meta">{t("obra.equipes.permissions.hint")}</p>
        </div>
        {state.isDirty && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" fullWidth={false} onClick={state.discard} disabled={state.isSaving}>
              {t("obra.equipes.permissions.discard")}
            </Button>
            <Button size="sm" fullWidth={false} onClick={state.save} disabled={state.isSaving}>
              {state.isSaving && <Loader2 size={14} className="animate-spin" />}
              {t("obra.equipes.permissions.save")}
            </Button>
          </div>
        )}
      </div>

      <PermissionMatrixBody state={state} memberCount={memberCount} focusRole={focusRole} onFocusRole={onFocusRole} />
    </section>
  )
}
