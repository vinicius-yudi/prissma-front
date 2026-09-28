import { Check } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { ProjectRoleInRequest } from "../../types/equipes"

const card = tv({
  base: "relative cursor-pointer rounded-[12px] p-3 text-left transition-shadow disabled:cursor-not-allowed disabled:opacity-40",
  variants: { selected: { true: "inset-ring-2 inset-ring-gold", false: "hairline hover:bg-raised" } },
})

interface RolePickerProps {
  roles: ProjectRoleInRequest[]
  value: ProjectRoleInRequest
  /** Papéis que a pessoa escolhida não pode ter (cliente só entra como cliente). */
  disabledRoles: ProjectRoleInRequest[]
  /** "N de M permissões" por papel, quando a matriz já carregou. */
  permissionSummary: (role: ProjectRoleInRequest) => string | null
  onChange: (role: ProjectRoleInRequest) => void
}

/** Papel na obra em cartões, cada um dizendo quanto ele pode. */
export function RolePicker({ roles, value, disabledRoles, permissionSummary, onChange }: RolePickerProps) {
  const { t } = useTranslation()

  return (
    <div role="radiogroup" aria-label={t("obra.equipes.addModal.roleLabel")} className="grid gap-2 sm:grid-cols-2">
      {roles.map((role) => {
        const selected = value === role
        const summary = permissionSummary(role)
        return (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabledRoles.includes(role)}
            onClick={() => onChange(role)}
            className={card({ selected })}
          >
            <span className="block text-[14px] font-[620] text-ink">{t(`roles.${role}`)}</span>
            {summary && <span className="mt-0.5 block text-[12px] text-meta">{summary}</span>}
            <AnimatePresence>
              {selected && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-gold text-on-gold">
                  <Check size={12} strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )
      })}
    </div>
  )
}
