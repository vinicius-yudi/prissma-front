import { Loader2, Mail } from "lucide-react"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Select } from "@/shared/components/ui/select/Select"
import { WorkspaceRole } from "@/shared/types/workspace"
import type { InvitableWorkspaceRole } from "@/shared/types/workspace"

export interface InviteRequest {
  email: string
  fullName?: string
  role: InvitableWorkspaceRole
}

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  roles: InvitableWorkspaceRole[]
  isSending: boolean
  onInvite: (request: InviteRequest) => Promise<unknown>
}

/** Convite para a equipe da conta: e-mail, nome opcional e papel. */
export function InviteMemberModal({ open, onClose, roles, isSending, onInvite }: InviteMemberModalProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<InvitableWorkspaceRole>(WorkspaceRole.MEMBER)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!email.trim()) return
    onInvite({ email: email.trim(), fullName: name.trim() || undefined, role })
      .then(() => {
        setEmail("")
        setName("")
        setRole(WorkspaceRole.MEMBER)
        onClose()
      })
      .catch(() => {})
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("workspace.team.inviteTitle")}
      description={t("workspace.team.hint")}
      icon={<Mail size={18} />}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 pb-6">
        <Field label={t("workspace.team.inviteEmail")}>
          {(id) => <Input id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label={t("workspace.team.inviteName")}>
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label={t("workspace.team.inviteRole")}>
          {(id) => (
            <Select
              id={id}
              value={role}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setRole(event.currentTarget.value as InvitableWorkspaceRole)
              }
            >
              {roles.map((option) => (
                <option key={option} value={option}>
                  {t(`workspace.roles.${option}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Button type="submit" disabled={isSending} className="mt-2">
          {isSending && <Loader2 size={16} className="animate-spin" />}
          {isSending ? t("workspace.team.inviteSending") : t("workspace.team.inviteSend")}
        </Button>
      </form>
    </Modal>
  )
}
