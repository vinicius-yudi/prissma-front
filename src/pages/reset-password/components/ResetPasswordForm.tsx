import { Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navigate } from "react-router-dom"

import { BackToLogin } from "@/shared/components/auth/BackToLogin"
import { PasswordInput } from "@/shared/components/auth/PasswordInput"
import { PasswordRules } from "@/shared/components/auth/PasswordRules"
import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"

import { useResetPasswordForm } from "../hooks/useResetPasswordForm"

export function ResetPasswordForm() {
  const { t } = useTranslation()
  const { form, onSubmit, isPending, hasToken } = useResetPasswordForm()
  const { errors } = form.formState
  const newPassword = form.watch("newPassword")

  // Link sem token não tem o que redefinir: volta para pedir outro.
  if (!hasToken) return <Navigate to="/forgot-password" replace />

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <>
      <h1 className="t-title text-[34px] text-ink">{t("resetPassword.title")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{t("resetPassword.subtitle")}</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field label={t("resetPassword.newPassword")} error={errorOf(errors.newPassword?.message)}>
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...form.register("newPassword")}
            />
          )}
        </Field>

        <PasswordRules value={newPassword} />

        <Field label={t("resetPassword.confirmPassword")} error={errorOf(errors.confirmPassword?.message)}>
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...form.register("confirmPassword")}
            />
          )}
        </Field>

        <Button type="submit" disabled={isPending} className="mt-2">
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? t("resetPassword.submitting") : t("resetPassword.submit")}
        </Button>
      </form>

      <BackToLogin />
    </>
  )
}
