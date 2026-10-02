import { CheckCircle2, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { PasswordInput } from "@/shared/components/auth/PasswordInput"
import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"

import { useAcceptInvite } from "../hooks/useAcceptInvite"

export function InviteForm({ token }: { token: string }) {
  const { t } = useTranslation()
  const { form, onSubmit, isPending, isSuccess, error } = useAcceptInvite(token)

  // Aceito: o convidado ainda não tem sessão, o caminho é o login.
  if (isSuccess) {
    return (
      <div>
        <CheckCircle2 size={28} className="text-success" />
        <p className="mt-4 text-[15px] text-ink-2">{t("invitePage.success")}</p>
        <Link
          to="/login"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-gold-grad px-4 text-[14px] font-[620] text-on-gold"
        >
          {t("invitePage.goLogin")}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <p className="text-[15px] text-ink-2">{t("invitePage.hint")}</p>

      <Field label={t("invitePage.nameLabel")}>
        {(id) => <Input id={id} autoComplete="name" {...form.register("fullName")} />}
      </Field>

      <Field label={t("invitePage.passwordLabel")} hint={t("invitePage.passwordHint")}>
        {(id) => <PasswordInput id={id} autoComplete="new-password" {...form.register("password")} />}
      </Field>

      {error && (
        <p role="alert" className="text-[13px] font-[560] text-danger">
          {error.message || t("invitePage.error")}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2">
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {isPending ? t("invitePage.accepting") : t("invitePage.accept")}
      </Button>
    </form>
  )
}
