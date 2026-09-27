import { ArrowRight, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { PasswordInput } from "@/shared/components/auth/PasswordInput"
import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"

import { useLoginForm } from "../hooks/useLoginForm"

export function LoginForm() {
  const { t } = useTranslation()
  const { form, onSubmit, isPending } = useLoginForm()
  const { errors } = form.formState

  return (
    <>
      <h1 className="t-title text-[36px] text-ink">{t("login.title")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{t("login.subtitle")}</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field label={t("login.email")} error={errors.email?.message && t(errors.email.message)}>
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
          )}
        </Field>

        <Field label={t("login.password")} error={errors.password?.message && t(errors.password.message)}>
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
          )}
        </Field>

        <div className="-mt-1 flex justify-end">
          <Link to="/forgot-password" className="text-[13px] font-semibold text-gold-hi hover:underline">
            {t("login.forgotPassword")}
          </Link>
        </div>

        <Button type="submit" disabled={isPending} className="mt-1">
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? t("login.submitting") : t("login.submit")}
          {!isPending && <ArrowRight size={16} />}
        </Button>
      </form>

      <p className="mt-8 text-[14px] text-ink-2">
        {t("login.noAccount")}{" "}
        <Link to="/cadastro" className="font-[650] text-gold-hi hover:underline">
          {t("login.register")}
        </Link>
      </p>
    </>
  )
}
