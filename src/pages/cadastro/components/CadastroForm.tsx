import { ArrowLeft, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { PasswordInput } from "@/shared/components/auth/PasswordInput"
import { PasswordRules } from "@/shared/components/auth/PasswordRules"
import { Button } from "@/shared/components/ui/button/Button"
import { Field } from "@/shared/components/ui/field/Field"
import { Input } from "@/shared/components/ui/input/Input"

import type { CadastroKind } from "../constants/cadastroKinds"
import { useCadastro } from "../hooks/useCadastro"

interface CadastroFormProps {
  kind: CadastroKind
  onBack: () => void
}

/**
 * Segundo passo do cadastro, igual para os três perfis. Erro de campo no
 * campo; a lista de regras marca a senha enquanto se digita.
 */
export function CadastroForm({ kind, onBack }: CadastroFormProps) {
  const { t } = useTranslation()
  const { form, onSubmit, isPending } = useCadastro(kind)
  const { errors } = form.formState
  const password = form.watch("password")

  function errorOf(message: string | undefined): string | undefined {
    return message ? t(message) : undefined
  }

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-6 inline-flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-sm px-2 text-[13.5px] font-semibold text-ink-2 transition-colors hover:bg-raised hover:text-ink"
      >
        <ArrowLeft size={15} />
        {t("register.changeKind")}
      </button>

      <h1 className="t-title text-[32px] text-ink">{t(`register.kinds.${kind}.title`)}</h1>

      <form onSubmit={onSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <Field label={t("register.fullName")} error={errorOf(errors.name?.message)}>
          {(id) => (
            <Input id={id} autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
          )}
        </Field>

        <Field label={t("register.email")} error={errorOf(errors.email?.message)}>
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              aria-invalid={!!errors.email}
              {...form.register("email")}
            />
          )}
        </Field>

        <Field label={t("register.password")} error={errorOf(errors.password?.message)}>
          {(id) => (
            <PasswordInput
              id={id}
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              {...form.register("password")}
            />
          )}
        </Field>

        <PasswordRules value={password} />

        <Field label={t("register.confirmPassword")} error={errorOf(errors.confirmPassword?.message)}>
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
          {isPending ? t("register.submitting") : t("register.submit")}
        </Button>
      </form>
    </>
  )
}
