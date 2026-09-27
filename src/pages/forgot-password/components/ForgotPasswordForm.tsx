import { Loader2, MailCheck } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { BackToLogin } from "@/shared/components/auth/BackToLogin"
import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"
import { SPRING } from "@/shared/constants/motion"

import { useForgotPasswordForm } from "../hooks/useForgotPasswordForm"

export function ForgotPasswordForm() {
  const { t } = useTranslation()
  const { form, onSubmit, isPending, sentTo } = useForgotPasswordForm()
  const { errors } = form.formState

  if (sentTo) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING}>
        <span className="flex size-14 items-center justify-center rounded-lg bg-gold-soft text-gold-hi">
          <MailCheck size={26} />
        </span>
        <h1 className="t-title mt-6 text-[32px] text-ink">{t("forgotPassword.sentTitle")}</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          {t("forgotPassword.sentBefore")} <b className="font-[650] text-ink">{sentTo}</b>{" "}
          {t("forgotPassword.sentAfter")}
        </p>
        <BackToLogin />
      </motion.div>
    )
  }

  return (
    <>
      <h1 className="t-title text-[34px] text-ink">{t("forgotPassword.title")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{t("forgotPassword.subtitle")}</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-4">
        <Field
          label={t("forgotPassword.email")}
          error={errors.email?.message ? t(errors.email.message) : undefined}
        >
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder={t("forgotPassword.emailPlaceholder")}
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
          )}
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
        </Button>
      </form>

      <BackToLogin />
    </>
  )
}
